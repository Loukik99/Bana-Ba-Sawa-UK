interface FormStatusProps {
  tone: "error" | "success";
  message: string;
}

export default function FormStatus({ tone, message }: FormStatusProps) {
  const classes =
    tone === "success"
      ? "border-forest-900/12 bg-forest-50 text-forest-800"
      : "border-[#8f2d2d]/20 bg-[#f8ecec] text-[#8f2d2d]";

  return (
    <p role="status" aria-live="polite" className={`rounded-[3px] border px-4 py-3 text-sm leading-relaxed ${classes}`}>
      {message}
    </p>
  );
}
