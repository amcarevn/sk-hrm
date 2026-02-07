import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectBoxProps<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function SelectBox<T>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: SelectBoxProps<T>) {
  const selected =
    options.find((o) => o.value === value) ||
    (placeholder ? { value, label: placeholder } : options[0]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1">{label}</label>

      <Listbox value={selected} onChange={(v) => onChange(v.value)}>
        <div className="relative">
          <Listbox.Button
            className="
              relative w-full cursor-pointer rounded-lg border border-gray-300
              bg-white py-2 pl-3 pr-10 text-left
              focus:outline-none focus:ring-2 focus:ring-blue-500
              
            "
          >
            <span className="block truncate">
              {selected?.label || placeholder || "Chọn"}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>

          <Listbox.Options
            className="
              absolute z-50 mt-1 max-h-60 w-full overflow-auto
              rounded-lg bg-white shadow-lg ring-1 ring-black/5
              
            "
          >
            {options.map((option) => (
              <Listbox.Option
                key={String(option.value)}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}
