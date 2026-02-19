// Re-export types and helpers from mock-data.
// Components import from here instead of mock-data directly,
// making it easy to swap the underlying data source.

export type {
  PostType,
  MockUser,
  MockPost,
  MockNotification,
  WorkoutData,
  MealData,
  QuoteData,
  StoryData,
  Exercise,
} from "./mock-data";

export { getTimeAgo, formatCount, postTypeConfig } from "./mock-data";
