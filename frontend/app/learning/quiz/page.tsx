import { Suspense } from "react";
import QuizClient from "./QuizClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading Quiz...</div>}>
      <QuizClient />
    </Suspense>
  );
}