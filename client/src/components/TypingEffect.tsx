import { useState, useEffect } from "react";

const words = [
  "Inventors",
  "Creators",
  "Originators",
  "Developers",
  "Thought Leaders",
  "Forward Thinkers",
  "Futurists",
];

export default function TypingEffect() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(words[0].length);
  const [deleting, setDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (deleting ? -1 : 1));

      if (!deleting && subIndex === words[index].length) {
        setTimeout(() => setDeleting(true), 1500);
      } else if (deleting && subIndex === 0) {
        setDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      }
    }, deleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [subIndex, deleting, index]);

  useEffect(() => {
    const blinkTimeout = setInterval(() => setBlink((prev) => !prev), 500);
    return () => clearInterval(blinkTimeout);
  }, []);

  return (
    <span className="inline-block relative min-w-[160px] text-center">
      <span className="text-[#0F534A] font-extrabold tracking-tight">
        {words[index].substring(0, subIndex)}
        <span className={`text-[#FE4E1A] font-black ${blink ? "opacity-100" : "opacity-0"}`}>|</span>
      </span>
    </span>
  );
}
