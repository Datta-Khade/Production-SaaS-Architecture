import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface BaseSubmoduleFormProps {
  title: string;
  sections: Array<{
    id: string;
    title: string;
    letter?: string;
  }>;
  schema: z.ZodSchema<any>;
  defaultValues: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  /** Primary brand color used for save button and section accents */
  primaryColor?: string;
  /** Background color for the form content area */
  backgroundColor?: string;
  children: (props: {
    activeSection: string;
    form: any;
    showConfirmDialog: (
      title: string,
      description: string,
      onConfirm: () => void
    ) => void;
  }) => React.ReactNode;
}

/**
 * BaseSubmoduleForm
 *
 * Full-screen scrollable form with a left sidebar stepper (desktop) and
 * a compact horizontal stepper (mobile). Provides a built-in confirmation
 * dialog helper for destructive in-form actions.
 *
 * Usage:
 * ```tsx
 * <BaseSubmoduleForm
 *   title="New Contract"
 *   sections={[{ id: 'basic', title: 'Basic Info', letter: 'B' }]}
 *   schema={contractSchema}
 *   defaultValues={defaultContractValues}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 * >
 *   {({ activeSection, form, showConfirmDialog }) => (
 *     activeSection === 'basic' && <BasicInfoSection form={form} />
 *   )}
 * </BaseSubmoduleForm>
 * ```
 */
export const BaseSubmoduleForm: React.FC<BaseSubmoduleFormProps> = ({
  title,
  sections,
  schema,
  defaultValues,
  onClose,
  onSubmit,
  primaryColor = "#16569e",
  backgroundColor = "#f8fafc",
  children,
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const showConfirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({ isOpen: true, title, description, onConfirm });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, title: "", description: "", onConfirm: () => {} });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-lg w-full h-[calc(100vh-2rem)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {/* Desktop save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => form.handleSubmit(onSubmit)()}
              className="hidden sm:flex items-center gap-2 text-white text-xs"
              style={{ backgroundColor: primaryColor }}
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            {/* Mobile save icon button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => form.handleSubmit(onSubmit)()}
              className="sm:hidden"
              data-testid="button-save-draft-mobile"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Horizontal Stepper */}
        <div className="block sm:hidden bg-white border-b px-4 py-3">
          <nav className="flex justify-center space-x-4">
            {sections.map((section, index) => {
              const isActive = activeSection === section.id;
              const sectionLetter =
                section.letter ||
                (section.id.length <= 2
                  ? section.id.toUpperCase()
                  : section.id.charAt(0).toUpperCase());

              return (
                <div key={section.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center justify-center"
                    data-testid={`button-step-mobile-${section.id}`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                        isActive
                          ? "text-white"
                          : "bg-gray-400 text-white"
                      }`}
                      style={isActive ? { backgroundColor: primaryColor } : undefined}
                    >
                      {sectionLetter}
                    </span>
                  </button>
                  {index < sections.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Stepper — Desktop only */}
          <aside className="hidden sm:block sticky top-0 self-start basis-20 md:basis-48 lg:basis-52 shrink-0 bg-gray-50 border-r overflow-y-auto">
            <div className="p-3">
              <nav className="space-y-1">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;
                  const sectionLetter =
                    section.letter ||
                    (section.id.length <= 2
                      ? section.id.toUpperCase()
                      : section.id.charAt(0).toUpperCase());

                  return (
                    <div key={section.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`group flex items-center w-full px-3 py-2 rounded-md transition-all border-l-4 min-h-[3rem] ${
                          isActive
                            ? "bg-blue-50 border-blue-600 text-blue-700"
                            : "border-transparent hover:bg-gray-100 text-gray-700"
                        }`}
                        aria-current={isActive ? "step" : undefined}
                        data-testid={`button-step-${section.id}`}
                      >
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                            isActive ? "text-white" : "bg-gray-500 text-white"
                          }`}
                          style={isActive ? { backgroundColor: primaryColor } : undefined}
                        >
                          {sectionLetter}
                        </span>
                        <span
                          className="hidden xl:block ml-3 text-left text-sm leading-tight flex-1"
                          data-testid={`text-step-title-${section.id}`}
                          title={section.title}
                          style={{
                            wordBreak: "break-word",
                            lineHeight: "1.2",
                            maxWidth: "8rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {section.title.replace(/^Part [A-Z]: /, "")}
                        </span>
                      </button>
                      {index < sections.length - 1 && (
                        <div className="absolute left-7 top-12 w-0.5 h-3 bg-gray-300" />
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Form Content */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6"
            style={{ backgroundColor }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-6"
              >
                {children({ activeSection, form, showConfirmDialog })}
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

/**
 * FormSection — Card wrapper with a styled title separator bar.
 */
export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  accentColor?: string;
}> = ({ title, description, children, accentColor = "#16569e" }) => (
  <Card className="bg-white">
    <CardContent className="p-6">
      <div className="pb-4 mb-6">
        <h3 className="text-xl font-semibold mb-2" style={{ color: accentColor }}>
          {title}
        </h3>
        {description && (
          <div style={{ color: accentColor }} className="text-sm">
            {description}
          </div>
        )}
        <div
          className="w-full h-0.5 mt-2"
          style={{ backgroundColor: accentColor }}
        />
      </div>
      {children}
    </CardContent>
  </Card>
);

/**
 * FormTable — Compact table layout for inline form data grids.
 */
export const FormTable: React.FC<{
  headers: string[];
  children: React.ReactNode;
}> = ({ headers, children }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="text-gray-600 text-xs font-normal py-2 px-4 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  </div>
);

/**
 * SAILFormField — Labeled field wrapper (non-RHF).
 */
export const SAILFormField: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <div className={className}>
    <Label className="text-xs text-gray-500 tracking-wide">{label}</Label>
    {children}
  </div>
);

/**
 * SAILInput — Input with white background.
 */
export const SAILInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => <Input {...props} className={`bg-white ${props.className || ""}`} />;

/**
 * SAILSelect — Select with white background.
 */
export const SAILSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}> = ({ value, onValueChange, placeholder, children }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="bg-white">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
);

/**
 * SAILButton — Button with semantic colour variants.
 */
export const SAILButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "success";
    children: React.ReactNode;
  }
> = ({ variant = "primary", children, className = "", ...props }) => {
  const variantClasses =
    variant === "success"
      ? "bg-green-500 hover:bg-green-600 text-white"
      : variant === "secondary"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-blue-400 hover:bg-blue-500 text-white";

  return (
    <Button className={`px-8 ${variantClasses} ${className}`} {...props}>
      {children}
    </Button>
  );
};
