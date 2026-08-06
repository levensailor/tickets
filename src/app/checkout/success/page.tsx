import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex max-w-lg justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment successful</CardTitle>
          <CardDescription>
            Thanks for your purchase. Your tickets will appear in purchase
            history once Stripe confirms the payment (usually instantly).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.session_id ? (
            <p className="break-all text-xs text-muted-foreground">
              Session: {params.session_id}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className={buttonVariants()}
            >
              View purchase history
            </Link>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Back to events
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
