import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { DEMO_MODE } from "@/lib/dev-mode";

const App = () => DEMO_MODE ? <Redirect href="/passenger" /> : <AuthenticatedApp />;

const AuthenticatedApp = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return <Redirect href="/(root)/(tabs)/home" />;

  return <Redirect href="/(auth)/welcome" />;
};

export default App;
