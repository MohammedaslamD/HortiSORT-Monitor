import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

type ValidateTarget = 'body' | 'query' | 'params'

/**
 * Factory that returns an Express middleware validating req[target] against schema.
 * On success, replaces req[target] with parsed (coerced) data.
 * On failure, passes ZodError to next() for errorHandler to format.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target])
      // Replace with coerced/transformed values
      ;(req as Record<string, unknown>)[target] = parsed
      next()
    } catch (err) {
      next(err)
    }
  }
}
