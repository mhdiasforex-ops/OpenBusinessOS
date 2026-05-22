'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Check, Loader2, Package, Zap, Tags, Lightbulb } from 'lucide-react';

const niches = [
  { value: 'RETAIL', label: '🛍️ Varejo', description: 'Lojas físicas e online' },
  { value: 'ECOMMERCE', label: '🌐 E-commerce', description: 'Venda digital e marketplace' },
  { value: 'SERVICES', label: '💼 Serviços', description: 'Prestação de serviços' },
  { value: 'FOOD', label: '🍽️ Alimentação', description: 'Restaurantes e delivery' },
  { value: 'PROFESSIONAL', label: '👨‍💼 Profissional Liberal', description: 'Médicos, advogados, consultores' },
  { value: 'CONSTRUCTION', label: '🏗️ Construção', description: 'Obras e reformas' },
  { value: 'HEALTH', label: '🏥 Saúde', description: 'Clínicas e consultórios' },
  { value: 'EDUCATION', label: '📚 Educação', description: 'Escolas e cursos' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productSale, setProductSale] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  const totalSteps = 4;

  const completeStep = async (stepId: string, data: Record<string, any>) => {
    setLoading(true);
    try {
      await api.post('/onboarding/step', { stepId, data });
      setCompletedSteps((prev) => [...prev, stepId]);
    } catch (err) {
      console.error('Failed to complete step:', err);
    }
    setLoading(false);
  };

  const handleSelectNiche = async (niche: string) => {
    setSelectedNiche(niche);
    setLoading(true);
    try {
      const res = await api.post('/onboarding/start', { niche });
      setConfig(res.data);
      setStep(1);
    } catch {
      setStep(1);
    }
    setLoading(false);
  };

  const handleCategoriesConfirm = async () => {
    const categories = config?.steps?.[0]?.preconfigured || [];
    await completeStep('categories', { categories });
    setStep(2);
  };

  const handleAddProduct = async () => {
    if (!productName || !productSku) return;
    await completeStep('products', {
      products: [{
        name: productName,
        sku: productSku,
        costPrice: parseFloat(productCost) || 0,
        salePrice: parseFloat(productSale) || 0,
        unit: 'un',
        category: config?.steps?.[0]?.preconfigured?.[0] || 'Geral',
      }],
    });
    setProductName('');
    setProductSku('');
    setProductCost('');
    setProductSale('');
    setStep(3);
  };

  const handleWorkflowsConfirm = async () => {
    const workflows = config?.steps?.[2]?.templates || [];
    if (workflows.length > 0) {
      await completeStep('workflows', { workflows });
    }
    setStep(4);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Mark tips as read
      await completeStep('tips', {});
      await api.post('/onboarding/complete');
    } catch {
      // continue anyway
    }
    setLoading(false);
    router.push('/dashboard');
  };

  const StepIndicator = ({ current, total }: { current: number; total: number }) => (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-2 w-8 rounded-full transition-colors ${i < current ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Bem-vindo ao OpenBusinessOS!</h1>
          <p className="text-muted-foreground mt-2">
            {step === 0 ? 'Vamos configurar sua empresa em poucos passos' :
             step === 1 ? 'Categorias financeiras pré-configuradas' :
             step === 2 ? 'Cadastre seus primeiros produtos' :
             step === 3 ? 'Automações sugeridas para seu nicho' :
             'Tudo pronto!'}
          </p>
        </div>

        <StepIndicator current={step} total={totalSteps} />

        {/* Step 0: Niche Selection */}
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {niches.map((niche) => (
              <Card
                key={niche.value}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedNiche === niche.value ? 'ring-2 ring-primary' : ''}`}
                onClick={() => !loading && handleSelectNiche(niche.value)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{niche.label}</CardTitle>
                  <CardDescription>{niche.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Step 1: Categories */}
        {step === 1 && config && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <CardTitle>Categorias Financeiras</CardTitle>
              </div>
              <CardDescription>Configurado para {config.niche}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {config.steps?.[0]?.preconfigured?.map((cat: string) => (
                  <span key={cat} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {cat}
                  </span>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCategoriesConfirm} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Confirmar Categorias
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Products */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Produtos/Serviços</CardTitle>
              </div>
              <CardDescription>Cadastre seu primeiro produto ou serviço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.steps?.[1]?.templates?.map((tpl: any) => (
                <div key={tpl.name} className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">Sugestão: {tpl.name} ({tpl.unit})</p>
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="p-name">Nome</Label>
                  <Input id="p-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Consultoria" />
                </div>
                <div>
                  <Label htmlFor="p-sku">SKU</Label>
                  <Input id="p-sku" value={productSku} onChange={(e) => setProductSku(e.target.value)} placeholder="Ex: CONS-001" />
                </div>
                <div>
                  <Label htmlFor="p-cost">Custo (R$)</Label>
                  <Input id="p-cost" type="number" value={productCost} onChange={(e) => setProductCost(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="p-sale">Preço de Venda (R$)</Label>
                  <Input id="p-sale" type="number" value={productSale} onChange={(e) => setProductSale(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>← Voltar</Button>
                <Button onClick={handleAddProduct} disabled={loading || (!productName && !productSku)}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {productName ? 'Salvar Produto' : 'Pular →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Workflows */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Automações Sugeridas</CardTitle>
              </div>
              <CardDescription>Workflows pré-configurados para seu nicho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.steps?.[2]?.templates?.length > 0 ? (
                config.steps[2].templates.map((wf: any) => (
                  <div key={wf.name} className="p-4 border rounded-lg space-y-1">
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-sm text-muted-foreground">Gatilho: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{wf.trigger}</span></p>
                    <p className="text-sm text-muted-foreground">{wf.steps?.length || 0} passo(s)</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhuma automação sugerida para este nicho. Você pode criar depois!</p>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>← Voltar</Button>
                <Button onClick={handleWorkflowsConfirm} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Ativar Automações
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Tips + Complete */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Dicas para seu nicho</CardTitle>
              </div>
              <CardDescription>Recommendations para começar com o pé direito</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.steps?.[3]?.tips?.map((tip: string, i: number) => (
                <div key={i} className="flex gap-3 p-3 border rounded-lg">
                  <span className="text-primary font-bold text-lg">{i + 1}</span>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
              <div className="pt-4 text-center">
                <Button size="lg" onClick={handleComplete} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '🎉 '}
                  Concluir Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
