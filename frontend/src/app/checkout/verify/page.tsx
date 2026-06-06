"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($reference: String!, $transactionId: String!) {
    verifyPayment(reference: $reference, transactionId: $transactionId) {
      id
      status
      paymentStatus
    }
  }
`;

interface VerifyPaymentData {
  verifyPayment: {
    id: string;
    status: string;
    paymentStatus: string;
  } | null;
}

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Flutterwave redirects with tx_ref (our reference) and transaction_id
  const reference = searchParams.get("tx_ref") || searchParams.get("reference");
  const transactionId = searchParams.get("transaction_id") || "";

  const [verifyPayment, { data, loading }] = useMutation<VerifyPaymentData>(VERIFY_PAYMENT);

  useEffect(() => {
    if (reference && transactionId) {
      verifyPayment({ variables: { reference, transactionId } }).catch(console.error);
    }
  }, [reference, transactionId, verifyPayment]);

  if (!reference) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-destructive font-bold uppercase tracking-widest">No payment reference provided.</p>
        <button onClick={() => router.push("/")} className="mt-8 border border-brand-gold text-brand-gold px-8 py-3 uppercase tracking-widest text-sm font-bold">Return Home</button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
        <p className="text-muted-foreground uppercase tracking-widest font-bold">Verifying your payment...</p>
      </div>
    );
  }

  const order = data?.verifyPayment;

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-6">
        <XCircle className="text-destructive" size={64} />
        <h1 className="font-serif text-3xl uppercase tracking-widest">Verification Failed</h1>
        <Link href="/checkout" className="border border-brand-gold text-brand-gold px-8 py-4 uppercase tracking-widest font-bold text-sm hover:bg-brand-gold hover:text-black transition-colors w-full mt-4">Try Again</Link>
      </div>
    );
  }

  if (order.paymentStatus === "PAID") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-6">
        <CheckCircle2 className="text-green-500" size={64} />
        <h1 className="font-serif text-3xl uppercase tracking-widest">Payment Successful</h1>
        <p className="text-muted-foreground leading-relaxed">
          Your order #{order.id.slice(0, 8)} has been confirmed. A receipt has been sent to your email.
        </p>
        <Link href={`/account/orders`} className="bg-brand-gold text-black px-8 py-4 uppercase tracking-widest font-bold text-sm hover:bg-brand-gold-light transition-colors w-full mt-4">
          View Order History
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-6">
      <XCircle className="text-destructive" size={64} />
      <h1 className="font-serif text-3xl uppercase tracking-widest">Payment Failed</h1>
      <p className="text-muted-foreground leading-relaxed">
        We could not verify your payment. Please try again or contact support.
      </p>
      <Link href="/checkout" className="border border-brand-gold text-brand-gold px-8 py-4 uppercase tracking-widest font-bold text-sm hover:bg-brand-gold hover:text-black transition-colors w-full mt-4">
        Try Again
      </Link>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
        <p className="text-muted-foreground uppercase tracking-widest font-bold">Verifying your payment...</p>
      </div>
    }>
      <VerifyPaymentContent />
    </Suspense>
  );
}
