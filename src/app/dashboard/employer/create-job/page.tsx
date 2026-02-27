"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

export default function CreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  const { address, isConnected, connect } = useWallet();

  // Estado del formulario - IGUAL AL PDF
  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    title: "",
    category: "",
    type: "one-time",

    // Paso 2: Descripción detallada
    description: "",
    problem: "",
    context: "",

    // Paso 3: Entregables y requisitos
    deliverables: [""],
    requirements: "",
    skills: [] as string[],

    // Paso 4: Presupuesto y tiempo
    amount: 0,
    estimatedDays: 0,
    deadline: "",
    negotiable: false,
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // 1. Verificar que la wallet está conectada
      if (!isConnected || !address) {
        console.log('🔄 Wallet no conectada, conectando...');
        const connectedAddress = await connect();
        
        if (!connectedAddress) {
          alert("❌ No se pudo conectar la wallet. Intenta de nuevo.");
          return;
        }
        
        // Pequeña pausa para que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 2. AHORA SÍ tenemos address
      console.log('📍 Enviando trabajo con wallet:', address);

      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          stellarAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el trabajo");
      }

      console.log('Trabajo creado:', data);

      // Navegar al dashboard del employer
      router.push("/dashboard/employer");
      
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Error al crear el trabajo. Intenta de nuevo.");
    }
  };

  // PASO 1: INFORMACIÓN BÁSICA
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Publicar Trabajo</h1>
          <p className="text-gray-600">Paso 1 de 5: Información básica</p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div className="w-1/5 bg-blue-600 h-2 rounded-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Título del trabajo */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Título del trabajo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Logo para startup de fintech"
              className="w-full p-3 border rounded-lg"
              value={formData.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-3 border rounded-lg"
              value={formData.category}
              onChange={(e) => updateForm("category", e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              <option value="design">Diseño</option>
              <option value="development">Desarrollo</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Redacción</option>
            </select>
          </div>

          {/* Tipo de proyecto */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de proyecto
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="one-time"
                  checked={formData.type === "one-time"}
                  onChange={(e) => updateForm("type", e.target.value)}
                  className="mr-2"
                />
                Proyecto único
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ongoing"
                  checked={formData.type === "ongoing"}
                  onChange={(e) => updateForm("type", e.target.value)}
                  className="mr-2"
                />
                Trabajo continuo
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => router.push("/dashboard/employer")}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.category}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 2: DESCRIPCIÓN DETALLADA
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Publicar Trabajo</h1>
          <p className="text-gray-600">Paso 2 de 5: Descripción detallada</p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div className="w-2/5 bg-blue-600 h-2 rounded-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Descripción completa */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción completa <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe el trabajo en detalle..."
              className="w-full p-3 border rounded-lg"
              value={formData.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          {/* ¿Qué problema estás resolviendo? */}
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Qué problema estás resolviendo?
            </label>
            <textarea
              rows={3}
              placeholder="Explica el problema o necesidad..."
              className="w-full p-3 border rounded-lg"
              value={formData.problem}
              onChange={(e) => updateForm("problem", e.target.value)}
            />
          </div>

          {/* Contexto del proyecto */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contexto del proyecto
            </label>
            <textarea
              rows={3}
              placeholder="Información adicional sobre tu empresa/proyecto..."
              className="w-full p-3 border rounded-lg"
              value={formData.context}
              onChange={(e) => updateForm("context", e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.description}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 3: ENTREGABLES Y REQUISITOS
  if (step === 3) {
    const addDeliverable = () => {
      setFormData((prev) => ({
        ...prev,
        deliverables: [...prev.deliverables, ""],
      }));
    };

    const updateDeliverable = (index: number, value: string) => {
      const newDeliverables = [...formData.deliverables];
      newDeliverables[index] = value;
      setFormData((prev) => ({ ...prev, deliverables: newDeliverables }));
    };

    const removeDeliverable = (index: number) => {
      if (formData.deliverables.length > 1) {
        const newDeliverables = formData.deliverables.filter(
          (_, i) => i !== index,
        );
        setFormData((prev) => ({ ...prev, deliverables: newDeliverables }));
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Publicar Trabajo</h1>
          <p className="text-gray-600">Paso 3 de 5: Entregables y requisitos</p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div className="w-3/5 bg-blue-600 h-2 rounded-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Entregables */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ¿Qué debe incluir la entrega?{" "}
              <span className="text-red-500">*</span>
            </label>
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Entregable ${index + 1}`}
                  className="flex-1 p-3 border rounded-lg"
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                />
                {formData.deliverables.length > 1 && (
                  <button
                    onClick={() => removeDeliverable(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addDeliverable}
              className="text-blue-600 text-sm mt-1"
            >
              + Agregar otro entregable
            </button>
          </div>

          {/* Requisitos especiales */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Requisitos especiales
            </label>
            <textarea
              rows={3}
              placeholder="Experiencia requerida, herramientas específicas, etc..."
              className="w-full p-3 border rounded-lg"
              value={formData.requirements}
              onChange={(e) => updateForm("requirements", e.target.value)}
            />
          </div>

          {/* Skills necesarios */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Skills necesarios
            </label>
            <input
              type="text"
              placeholder="Ej: React, Diseño UX, Copywriting (separados por coma)"
              className="w-full p-3 border rounded-lg"
              value={formData.skills.join(", ")}
              onChange={(e) =>
                updateForm(
                  "skills",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!formData.deliverables[0]}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 4: PRESUPUESTO Y TIEMPO
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Publicar Trabajo</h1>
          <p className="text-gray-600">Paso 4 de 5: Presupuesto y tiempo</p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div className="w-4/5 bg-blue-600 h-2 rounded-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Presupuesto */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Presupuesto (USDC) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                placeholder="500"
                className="w-full p-3 pl-8 border rounded-lg"
                value={formData.amount || ""}
                onChange={(e) => updateForm("amount", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Tiempo estimado */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tiempo estimado (días) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="7"
              className="w-full p-3 border rounded-lg"
              value={formData.estimatedDays || ""}
              onChange={(e) =>
                updateForm("estimatedDays", Number(e.target.value))
              }
            />
          </div>

          {/* Fecha límite (opcional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              className="w-full p-3 border rounded-lg"
              value={formData.deadline}
              onChange={(e) => updateForm("deadline", e.target.value)}
            />
          </div>

          {/* ¿Es negociable? */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.negotiable}
                onChange={(e) => updateForm("negotiable", e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">El presupuesto es negociable</span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(5)}
              disabled={!formData.amount || !formData.estimatedDays}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 5: REVISIÓN
  if (step === 5) {
    const platformFee = formData.amount * 0.02;
    const total = formData.amount + platformFee;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Revisa tu trabajo</h1>
          <p className="text-gray-600">
            Paso 5 de 5: Confirma que todo esté correcto
          </p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div className="w-full bg-blue-600 h-2 rounded-full" />
          </div>
        </div>

        {/* Resumen visual - IGUAL AL PDF */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {formData.title || "Sin título"}
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Presupuesto:</span>
              <p className="font-medium">${formData.amount} USDC</p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Tiempo estimado:</span>
              <p className="font-medium">{formData.estimatedDays} días</p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Categoría:</span>
              <p className="font-medium capitalize">{formData.category}</p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Descripción:</span>
              <p className="text-gray-700">{formData.description}</p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Entregables:</span>
              <ul className="list-disc list-inside">
                {formData.deliverables.map((d, i) => (
                  <li key={i} className="text-gray-700">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Desglose de costos - IGUAL AL PDF */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Desglose de costos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Presupuesto del trabajo:</span>
              <span>${formData.amount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Fee de plataforma (2%):</span>
              <span>${platformFee.toFixed(2)} USDC</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total a depositar:</span>
                <span>${total.toFixed(2)} USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Por qué depositar ahora - IGUAL AL PDF */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-sm">
          <p className="font-medium mb-1">🔒 ¿Por qué depositar ahora?</p>
          <p className="text-gray-600">
            Los fondos quedan en garantía (no se tocan). Solo se liberan cuando
            apruebes el trabajo. Genera confianza con freelancers.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep(4)}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Publicar trabajo
          </button>
        </div>
      </div>
    );
  }
}
