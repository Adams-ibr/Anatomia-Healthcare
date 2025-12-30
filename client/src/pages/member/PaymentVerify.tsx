import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentVerify() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get("reference") || urlParams.get("tx_ref") || urlParams.get("trxref");
      const transactionId = urlParams.get("transaction_id");

      if (!reference) {
        setStatus("error");
        setMessage("No payment reference found");
        return;
      }

      try {
        const isFlutterwave = reference.startsWith("fw_") || transactionId;
        const endpoint = isFlutterwave
          ? `/api/payments/verify-flutterwave/${reference}`
          : `/api/payments/verify-paystack/${reference}`;

        const response = await fetch(endpoint, {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
          setStatus("success");
          setMessage("Your membership has been activated!");
        } else {
          setStatus("error");
          setMessage(data.error || "Payment verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify payment. Please contact support.");
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-red-600">Payment Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {status !== "loading" && (
            <div className="space-y-3">
              <Button asChild className="w-full" data-testid="button-go-dashboard">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              {status === "error" && (
                <Button asChild variant="outline" className="w-full" data-testid="button-try-again">
                  <Link href="/subscribe">Try Again</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
