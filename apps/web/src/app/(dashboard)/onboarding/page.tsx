'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Rocket, CheckCircle, Circle, ChevronRight, ChevronLeft, Building2, CreditCard, Users, MessageSquare, PartyPopper, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'businessos-onboarding';

const steps = [
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'payment', label: 'Pagamentos', icon: CreditCard },
  { id: 'team', label: 'Time', icon: Users },
  { id: 'integrations', label: 'Integracoes', icon: MessageSquare },
  { id: 'done', label: 'Concluir', icon: PartyPopper },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    companyNiche: '',
    companySize: '',
    paymentGateway: '',
    teamSize: '',
    integrations: [] as string[],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompleted(parsed.completed ?? false);
        if (!parsed.completed) {
          setCurrentStep(parsed.currentStep ?? 0);
          setForm(parsed.form ?? form);
        }
      } catch { /* ignore */ }
    }
  }, []);

  const saveState = (step: number, formData: typeof form) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep: step, form: formData, completed: false }));
  };

  const updateForm = (key: keyof typeof form, value: any) => {
    const next = { ...form, [key]: value };
    setForm(next);
    saveState(currentStep, next);
  };

  const nextStep = () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    saveState(next, form);
  };

  const prevStep = () => {
    const prev = currentStep - 1;
    setCurrentStep(prev);
    saveState(prev, form);
  };

  const finishOnboarding = () => {
    setCompleted(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true, form }));
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCompleted(false);
    setCurrentStep(0);
    setForm({ companyName: '', companyNiche: '', companySize: '', paymentGateway: '', teamSize: '', integrations: [] });
  };

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Onboarding Concluido!</CardTitle>
            <CardDescription>Sua empresa esta pronta para usar o BusinessOS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Voce pode refazer o onboarding a qualquer momento.
            </p>
            <Button variant="outline" onClick={resetOnboarding}>
              Refazer Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Onboarding</h1>
        <Badge variant="outline" className="gap-1"><Rocket className="h-3 w-3" /> Passo {currentStep + 1} de {steps.length}</Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <CardHeader className="p-0"><CardTitle className="text-xl flex items-center gap-2"><Building2 className="h-5 w-5" /> Dados da Empresa</CardTitle></CardHeader>
              <CardDescription>Informe os dados basicos da sua empresa</CardDescription>
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input placeholder="Ex: Minha Empresa Ltda" value={form.companyName} onChange={e => updateForm('companyName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Segmento / Nicho</Label>
                <Input placeholder="Ex: Tecnologia, Saude, Varejo" value={form.companyNiche} onChange={e => updateForm('companyNiche', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Porte da Empresa</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.companySize} onChange={e => updateForm('companySize', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="MEI">MEI</option>
                  <option value="ME">Microempresa (ME)</option>
                  <option value="EPP">Empresa de Pequeno Porte</option>
                  <option value="MEDIO">Medio Porte</option>
                  <option value="GRANDE">Grande Porte</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <CardHeader className="p-0"><CardTitle className="text-xl flex items-center gap-2"><CreditCard className="h-5 w-5" /> Gateway de Pagamento</CardTitle></CardHeader>
              <CardDescription>Configure seu gateway de pagamento para receber cobrancas</CardDescription>
              <div className="space-y-2">
                <Label>Gateway Preferido</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.paymentGateway} onChange={e => updateForm('paymentGateway', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="ASAAS">Asaas</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="MERCADO_PAGO">Mercado Pago</option>
                  <option value="PAGSEGURO">PagSeguro</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">Voce pode configurar os detalhes da integracao nas Configuracoes de Pagamento.</p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <CardHeader className="p-0"><CardTitle className="text-xl flex items-center gap-2"><Users className="h-5 w-5" /> Equipe</CardTitle></CardHeader>
              <CardDescription>Quantas pessoas precisam de acesso ao sistema?</CardDescription>
              <div className="space-y-2">
                <Label>Tamanho da Equipe</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.teamSize} onChange={e => updateForm('teamSize', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="1">So eu</option>
                  <option value="2-5">2 a 5 pessoas</option>
                  <option value="6-20">6 a 20 pessoas</option>
                  <option value="21+">Mais de 20 pessoas</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">Voce podera convidar membros da equipe nas Configuracoes &gt; Membros.</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <CardHeader className="p-0"><CardTitle className="text-xl flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Integracoes</CardTitle></CardHeader>
              <CardDescription>Quais canais de comunicacao voce utiliza?</CardDescription>
              <div className="space-y-3">
                {[
                  { value: 'whatsapp', label: 'WhatsApp', desc: 'Envie e receba mensagens de clientes' },
                  { value: 'email', label: 'Email', desc: 'Configure disparo de emails transacionais' },
                  { value: 'sms', label: 'SMS', desc: 'Notificacoes via SMS' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={form.integrations.includes(opt.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.integrations, opt.value]
                          : form.integrations.filter((i) => i !== opt.value);
                        updateForm('integrations', next);
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <PartyPopper className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardHeader className="p-0"><CardTitle className="text-xl">Tudo Pronto!</CardTitle></CardHeader>
              <CardDescription>Revise as informacoes e conclua o onboarding.</CardDescription>
              <div className="text-left space-y-2 border rounded-lg p-4">
                <p className="text-sm"><strong>Empresa:</strong> {form.companyName || '-'}</p>
                <p className="text-sm"><strong>Segmento:</strong> {form.companyNiche || '-'}</p>
                <p className="text-sm"><strong>Porte:</strong> {form.companySize || '-'}</p>
                <p className="text-sm"><strong>Gateway:</strong> {form.paymentGateway || '-'}</p>
                <p className="text-sm"><strong>Equipe:</strong> {form.teamSize || '-'}</p>
                <p className="text-sm"><strong>Integracoes:</strong> {form.integrations.length ? form.integrations.join(', ') : 'Nenhuma'}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} disabled={currentStep === 0 && !form.companyName}>
                Proximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finishOnboarding}>
                <CheckCircle className="h-4 w-4 mr-1" /> Concluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
