import { subDays } from "date-fns";

type SegmentFilter = {
  browser?: string;
  location?: string;
  fromDate?: string;
  toDate?: string;
};

export function buildSubscriberWhere(filter?: SegmentFilter | null) {
  if (!filter) {
    return {};
  }

  const where: Record<string, unknown> = {};

  if (filter.browser) {
    where.browser = { contains: filter.browser, mode: "insensitive" };
  }

  if (filter.location) {
    where.location = { contains: filter.location, mode: "insensitive" };
  }

  if (filter.fromDate || filter.toDate) {
    where.createdAt = {
      gte: filter.fromDate ? new Date(filter.fromDate) : subDays(new Date(), 3650),
      lte: filter.toDate ? new Date(filter.toDate) : new Date(),
    };
  }

  return where;
}
