import { Suspense } from "react";
import JoinForm from "./JoinForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading Join...</div>}>
      <JoinForm />
    </Suspense>
  );
}
