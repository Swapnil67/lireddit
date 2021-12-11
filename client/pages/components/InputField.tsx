import {
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
};

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  size: _,
  ...props
}) => {
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <Input
        {...field}
        {...props}
        id={field.name}
        placeholder={props.placeholder}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  ...props
}) => {
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <Textarea
        {...field}
        {...props}
        id={field.name}
        placeholder={props.placeholder}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

// "" => false
// "There is error msg" => true
