import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { AssetModel } from '@/api/generated/endpoints';
import { Button, Surface, Text, TextField } from '@/design-system';

export type ConnectValues = {
  name: string;
  credentials: Record<string, string>;
};

/**
 * Builds the validation rules from the model's declared connection parameters, so a new
 * manufacturer needs no code change here.
 */
function buildSchema(model: AssetModel) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const parameter of model.connectionParameters) {
    let field = z.string();
    if (parameter.pattern) {
      field = field.regex(new RegExp(parameter.pattern), `${parameter.label} is not valid`);
    }
    shape[parameter.key] = parameter.required
      ? field.min(1, `${parameter.label} is required`)
      : field.optional().or(z.literal(''));
  }

  return z.object({
    name: z.string().min(1, 'Give the asset a name').max(80, 'Keep it under 80 characters'),
    credentials: z.object(shape),
  });
}

export function ConnectForm({
  model,
  submitting,
  onSubmit,
}: {
  model: AssetModel;
  submitting: boolean;
  onSubmit: (values: ConnectValues) => void;
}) {
  const schema = useMemo(() => buildSchema(model), [model]);

  const defaultCredentials = useMemo(
    () => Object.fromEntries(model.connectionParameters.map((parameter) => [parameter.key, ''])),
    [model],
  );

  const { control, handleSubmit } = useForm<ConnectValues>({
    // The credential keys come from the catalogue at runtime, so the schema's shape
    // cannot be known statically. The values are strings either way.
    resolver: zodResolver(schema) as Resolver<ConnectValues>,
    defaultValues: { name: model.name, credentials: defaultCredentials },
  });

  return (
    <Surface gap="lg">
      <Text variant="heading">Connect your {model.name}</Text>

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Name"
            hint="What you want to call it in this household."
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            testID="asset-name"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      {model.connectionParameters.map((parameter) => (
        <Controller
          key={parameter.key}
          control={control}
          name={`credentials.${parameter.key}`}
          render={({ field, fieldState }) => (
            <TextField
              label={parameter.label}
              autoCapitalize="none"
              hint={parameter.helpText}
              inputMode={parameter.type === 'number' ? 'numeric' : 'text'}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry={parameter.type === 'password'}
              testID={`asset-credential-${parameter.key}`}
              value={field.value ?? ''}
              error={fieldState.error?.message}
            />
          )}
        />
      ))}

      <Text variant="caption" tone="muted">
        These are sent to the manufacturer integration and are never shown again.
      </Text>

      <Button
        label="Add asset"
        size="lg"
        loading={submitting}
        onPress={() => void handleSubmit(onSubmit)()}
        testID="submit-asset"
      />
    </Surface>
  );
}
