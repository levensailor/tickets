import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CancelPageProps = {
  searchParams: Promise<{ event_id?: string }>;
};

export default async function CheckoutCancelPage({
  searchParams,
}: CancelPageProps) {
  const params = await searchParams;
  const eventHref = params.event_id
    ? `/events/${params.event_id}`
    : "/";

  return (
    <div className="mx-auto flex max-w-lg justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription>
            No payment was taken. You can return to the event and try again
            whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={eventHref} className={buttonVariants()}>
            Return to event
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Browse events
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
