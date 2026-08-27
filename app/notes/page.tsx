import dynamic from "next/dynamic";

const NotesPage = dynamic(
  () => import("@/components/notes-page").then((m) => m.NotesPage),
  { ssr: false }
);

export default function Notes() {
  return <NotesPage />;
}
