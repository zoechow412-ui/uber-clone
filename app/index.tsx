import { Redirect } from "expo-router";

// Test builds always open the passenger experience, never the old Uber demo.
export default function Index() {
  return <Redirect href="/passenger" />;
}
