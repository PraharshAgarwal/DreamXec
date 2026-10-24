# Coding Standards & Engineering Guidelines: dx-v2.0

---

## 🛠️ TypeScript & JavaScript Rules

1. **Strict Type Safety**: All TypeScript code must compile without `any` overrides unless strictly required for external stubs.
2. **Explicit Function Return Types**: Exported services and API controllers must explicitly state their return type signature.
3. **Module Imports**: Use ES module import syntax (`import { x } from './y'`). Relative imports within components should be clean.

---

## 🟢 Backend (Express Gateway) Guidelines

### 1. Route Handler Structure
Controller routes must be wrapped in async error handlers or try-catch blocks returning structured JSON envelopes:

```typescript
import { Request, Response, NextFunction } from 'express';
import { applicationSchema } from '../dto/onboarding';

export const submitApplicationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate payload using Zod
    const validatedData = applicationSchema.parse(req.body);
    
    // 2. Business logic execution
    const result = await onboardingService.processSubmission(validatedData);

    // 3. Structured envelope response
    return res.status(202).json({
      status: 'success',
      message: 'Application submitted and queued.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
```

### 2. Error Status Code Standards
* `400 Bad Request`: Payload validation failures (Zod parse errors).
* `401 Unauthorized`: Missing or expired JWT bearer token.
* `403 Forbidden`: Authenticated user lacks contextual permission (`UserOrganization.role`).
* `409 Conflict`: Duplicate request detected by Redis idempotency check (`SET NX`).
* `500 Internal Error`: System or database error (caught and logged to Sentry/console).

---

## 🎨 Frontend (React + Vite) Guidelines

### 1. Neobrutalist Design System Compliance
* Components must use styling tokens defined in `tailwind.config.js` and `src/index.css`.
* Use 3-5px solid borders (`border-4 border-dreamxec-navy`), zero border radiuses on cards, and hard offset box-shadows (`box-shadow: 4px 4px 0 #003366`).

### 2. Component Layout Example
```tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CampaignCardProps {
  title: string;
  category: string;
  goalAmount: number;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ title, category, goalAmount }) => {
  return (
    <div className="card-pastel p-6 card-pastel-tilt-right">
      <div className="card-tricolor-tag" />
      <span className="text-xs font-semibold text-dreamxec-saffron uppercase">{category}</span>
      <h3 className="text-xl font-bold text-dreamxec-navy my-2">{title}</h3>
      <p className="text-gray-600 font-mono font-semibold">Goal: ${goalAmount.toLocaleString()}</p>
      <button className="btn-pastel-primary mt-4 px-4 py-2 flex items-center gap-2">
        <span>Support Initiative</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
```
