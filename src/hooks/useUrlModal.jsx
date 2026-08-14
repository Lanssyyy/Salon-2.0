import { useSearchParams } from "react-router-dom";

// Syncs a modal/form's open state to URL search params (?modal=new-x / edit-x&id=...)
// so the Android hardware back button closes the modal instead of leaving the page.
export default function useUrlModal(key) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const editId = searchParams.get("id");
  const isNew = modal === `new-${key}`;
  const isEdit = modal === `edit-${key}`;
  const isOpen = isNew || isEdit;

  const openNew = () => {
    const next = new URLSearchParams(searchParams);
    next.set("modal", `new-${key}`);
    next.delete("id");
    setSearchParams(next);
  };

  const openEdit = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("modal", `edit-${key}`);
    next.set("id", id);
    setSearchParams(next);
  };

  const close = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("modal");
    next.delete("id");
    setSearchParams(next, { replace: false });
  };

  return { isOpen, isEdit, editId, openNew, openEdit, close };
}