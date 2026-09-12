import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { AssetModel } from '@/api/generated/endpoints';
import { Button, Surface, Text, TextField } from '@/design-system';

export type ConnectValues = {
  name: string;
  credentials: Record<string, string>;
};

type Translate = (
  key:
    | 'addAsset.fieldRequired'
    | 'addAsset.fieldInvalid'
    | 'addAsset.nameRequired'
    | 'addAsset.nameTooLong',
  options?: { field: string },
) => string;

/**
 * Builds the validation rules from the model's declared connection parameters, so a new
 * manufacturer needs no code change here, and the messages follow the active language.
 */
function buildSchema(model: AssetModel, t: Translate) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const parameter of model.connectionParameters) {
    let field = z.string();
    if (parameter.pattern) {
      field = field.regex(
        new RegExp(parameter.pattern),
        t('addAsset.fieldInvalid', { field: parameter.label }),
      );
    }
    shape[parameter.key] = parameter.required
      ? field.min(1, t('addAsset.fieldRequired', { field: parameter.label }))
      : field.optional().or(z.literal(''));
  }

  return z.object({
    name: z.string().min(1, t('addAsset.nameRequired')).max(80, t('addAsset.nameTooLong')),
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
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(model, t), [model, t]);

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
      <Text variant="heading">{t('addAsset.connectTitle', { model: model.name })}</Text>

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label={t('addAsset.nameLabel')}
            hint={t('addAsset.nameHint')}
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
        {t('addAsset.credentialsNote')}
      </Text>

      <Button
        label={t('addAsset.submit')}
        size="lg"
        loading={submitting}
        onPress={() => void handleSubmit(onSubmit)()}
        testID="submit-asset"
      />
    </Surface>
  );
}
