const cron = require("node-cron");
const prisma = require("../config/prisma");
const redis = require("../config/redis");
const { publishEvent } = require("../config/eventPublisher");
const EVENTS = require("../config/events");

cron.schedule("0 0 * * *", async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateKey = today.toISOString().split("T")[0];
  const lockKey = `dx:lock:cron:milestones:${dateKey}`;

  // Distributed Lock: Ensure only 1 instance runs the daily cron across load-balanced cluster
  try {
    if (redis && redis.set) {
      const acquired = await redis.set(lockKey, "locked", { NX: true, EX: 86400 });
      if (!acquired) {
        console.log(`[MilestoneCron] Job for ${dateKey} already processed by another cluster instance. Skipping.`);
        return;
      }
    }
  } catch (err) {
    console.warn("[MilestoneCron] Redis distributed lock check error:", err.message);
  }

  console.log("Running milestone reminder cron...");


  try {
    const milestones = await prisma.campaignMilestone.findMany({
      where: {
        status: { in: ["ACTIVE", "PLANNED"] },
        deadline: { not: null },
      },
      include: {
        campaign: {
          include: {
            student: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });

    for (const milestone of milestones) {
      const student = milestone.campaign?.student;
      if (!student?.email || !milestone.deadline) continue;

      const dueDate = new Date(milestone.deadline);
      dueDate.setUTCHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      try {
        if (diffDays === 3) {
          await publishEvent(EVENTS.MILESTONE_REMINDER, {
            email: student.email,
            name: student.fullName || "Student Lead",
            milestoneTitle: milestone.title,
            projectTitle: milestone.campaign.title,
            dueDate,
          });
        } else if (diffDays === 1) {
          await publishEvent(EVENTS.MILESTONE_URGENT_REMINDER, {
            email: student.email,
            name: student.fullName || "Student Lead",
            milestoneTitle: milestone.title,
            projectTitle: milestone.campaign.title,
            dueDate,
          });
        } else if ([-1, -3, -7, -14].includes(diffDays)) {
          // Send overdue notification on specific days (1, 3, 7, 14 days after due date) rather than spamming every single day forever
          await publishEvent(EVENTS.MILESTONE_OVERDUE, {
            email: student.email,
            name: student.fullName || "Student Lead",
            milestoneTitle: milestone.title,
            projectTitle: milestone.campaign.title,
            dueDate,
          });
        }
      } catch (err) {
        console.error(`Milestone notification error for ${milestone.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Milestone reminder cron error:", err.message);
  }
});