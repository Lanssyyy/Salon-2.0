import { Children, isValidElement, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, ChevronDown } from "lucide-react";

// Drop-in replacement for a native <select>: pass <option> children as usual.
// On mobile it opens a vaul bottom drawer instead of the native OS picker.
export default function MobileSelect({ value, onChange, children, className, disabled, required, placeholder }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((opt) => ({ value: opt.props.value ?? opt.props.children, label: opt.props.children }));

  if (!isMobile) {
    return (
      <select value={value} onChange={onChange} className={className} disabled={disabled} required={required}>
        {children}
      </select>
    );
  }

  const selected = options.find((o) => o.value === value);

  const pick = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`${className} flex items-center justify-between text-left disabled:opacity-50`}
      >
        <span className={selected ? "" : "text-stone-400"}>{selected ? selected.label : placeholder || "Select..."}</span>
        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0 ml-2" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)] bg-white text-stone-900" style={{ colorScheme: "light" }}>
          <DrawerHeader>
            <DrawerTitle className="font-display text-stone-900">Select an option</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
            {options.map((o, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(o.value)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-stone-800 hover:bg-stone-50 active:bg-stone-100"
              >
                <span>{o.label}</span>
                {o.value === value && <Check className="w-4 h-4 text-stone-900" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}