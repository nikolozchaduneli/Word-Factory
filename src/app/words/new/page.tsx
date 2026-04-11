import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmitWordForm from "@/components/SubmitWordForm";

export default async function NewWordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Submit a Word</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Submit a foreign word or concept that lacks a Georgian equivalent.
        The community and AI will propose neologisms.
      </p>
      <SubmitWordForm />
    </div>
  );
}
