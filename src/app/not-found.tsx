import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
      <p className="text-muted-foreground">
        That event or page does not exist.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to events
      </Link>
    </div>
  );
}
