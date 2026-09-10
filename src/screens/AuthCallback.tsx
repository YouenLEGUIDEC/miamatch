import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Label, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { exchangeEmailCode, finishEmailLogin } from '../data/emailAuth';

export default function AuthCallback() {
  const params = useLocalSearchParams();
  const app = useApp();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const code = params.code;
  const flowId = params.sb_flow_id;
  const rejected = params.error || params.error_code;
  useEffect(() => {
    let active = true;
    async function complete() {
      setError('');
      try {
        if (app.mode === 'demo')
          throw new Error('Quittez la démo depuis votre profil, puis demandez un nouveau lien.');
        if (
          rejected ||
          typeof code !== 'string' ||
          !code ||
          (flowId !== undefined && typeof flowId !== 'string')
        )
          throw new Error('Lien invalide ou expiré. Demandez un nouveau lien depuis la connexion.');
        await exchangeEmailCode(code, flowId as string | undefined);
        const household = await finishEmailLogin();
        if (!active) return;
        if (household) await app.loadHousehold(household);
        if (active) router.replace(household ? '/' : '/crew');
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Connexion impossible. Réessayez.');
      }
    }
    void complete();
    return () => {
      active = false;
    };
    // Auth state updates during the exchange must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, flowId, rejected, attempt]);
  return (
    <Screen>
      <Title>{error ? 'On reprend ?' : 'Bienvenue à table.'}</Title>
      <Label>{error || 'Connexion en cours…'}</Label>
      {error && (
        <>
          <Button onPress={() => setAttempt((n) => n + 1)}>Réessayer</Button>
          <Button secondary onPress={() => router.replace('/welcome')}>
            Retour à la connexion
          </Button>
        </>
      )}
    </Screen>
  );
}
