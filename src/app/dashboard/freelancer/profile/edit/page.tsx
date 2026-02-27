"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Profile, Language } from "@/lib/profile";
import FreelancerHeader from "@/components/dashboard/FreelancerHeader"

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Profile>({
    name: "",
    username: "",
    email: "",
    occupation: "",
    bio: "",
    country: "",
    skills: [],
    experienceYears: 0,
    education: "",
    availability: [],
    languages: [],
    avatar: "",
    cvFile: "",
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("brujula_profile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setForm(parsed);
      setSkillsInput(parsed.skills?.join(", ") || "");
    }
    setLoading(false);
  }, []);

  const handleChange = (e: any) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleAvailability = (value: string) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(value)
        ? prev.availability.filter((v) => v !== value)
        : [...prev.availability, value],
    }));
  };

  const addLanguage = () => {
    if (!language || !level) return;

    const newLang: Language = { name: language, level };

    setForm((prev) => ({
      ...prev,
      languages: [...prev.languages, newLang],
    }));

    setLanguage("");
    setLevel("");
  };

  const handleAvatar = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((prev) => ({ ...prev, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, cvFile: file.name }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const profile = { ...form, skills: skillsArray };

    localStorage.setItem("brujula_profile", JSON.stringify(profile));
    router.push("/dashboard/freelancer/profile");
  };

  if (loading) return null;

  return (
    <>
      <FreelancerHeader />
      <div className="min-h-screen bg-[#0b0f14] text-gray-200 flex justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl bg-[#121821] border border-[#1f2a37] rounded-2xl shadow-2xl p-10 space-y-10"
        >
          {/* HEADER */}
          <div className="border-b border-[#1f2a37] pb-6">
            <h1 className="text-3xl font-semibold tracking-tight">
              Perfil Profesional
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Este perfil representa tu identidad profesional dentro de la red.
            </p>
          </div>

          {/* AVATAR */}
          <section className="space-y-4">
            <Label>Foto de perfil</Label>

            <label className="flex items-center gap-6 cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />

              {form.avatar ? (
                <img
                  src={form.avatar}
                  className="w-20 h-20 rounded-full object-cover border border-[#243041]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1c2532]" />
              )}

              <div className="border border-dashed border-[#2b3a4d] px-6 py-3 rounded-lg text-sm text-gray-400 group-hover:border-blue-500 group-hover:text-blue-400 transition">
                Click para subir imagen
              </div>
            </label>
          </section>

          {/* INFO BASICA */}
          <section className="grid md:grid-cols-2 gap-5">
            <Input name="name" placeholder="Nombre completo" value={form.name} onChange={handleChange} />
            <Input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
            <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <Input name="occupation" placeholder="Ocupación" value={form.occupation} onChange={handleChange} />
            <Input name="country" placeholder="País" value={form.country} onChange={handleChange} />
            <Input
              type="number"
              name="experienceYears"
              placeholder="Años de experiencia"
              value={form.experienceYears}
              onChange={handleChange}
            />
          </section>

          {/* BIO */}
          <section>
            <Label>Resumen Profesional</Label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="w-full bg-[#0f141c] border border-[#1f2a37] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
            />
          </section>

          {/* SKILLS */}
          <section>
            <Label>Skills</Label>
            <Input
              placeholder="React, Node.js, Solidity..."
              value={skillsInput}
              onChange={(e: any) => setSkillsInput(e.target.value)}
            />
          </section>

          {/* EDUCACION */}
          <section>
            <Label>Educación</Label>
            <Input name="education" value={form.education} onChange={handleChange} />
          </section>

          {/* DISPONIBILIDAD */}
          <section>
            <Label>Disponibilidad</Label>
            <div className="grid grid-cols-2 gap-3">
              {["Tiempo completo", "Medio tiempo", "Freelance", "Noches"].map(
                (opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleAvailability(opt)}
                    className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition
                    ${
                      form.availability.includes(opt)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-[#1f2a37] text-gray-400 hover:border-blue-500"
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </section>

          {/* IDIOMAS */}
          <section className="space-y-3">
            <Label>Idiomas</Label>

            <div className="flex gap-3">
              <Input
                placeholder="Idioma"
                value={language}
                onChange={(e: any) => setLanguage(e.target.value)}
              />

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-[#0f141c] border border-[#1f2a37] rounded-lg px-3 cursor-pointer focus:border-blue-500"
              >
                <option value="">Nivel</option>
                <option>Básico</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
                <option>Nativo</option>
              </select>

              <button
                type="button"
                onClick={addLanguage}
                className="px-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg cursor-pointer"
              >
                Añadir
              </button>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              {form.languages.map((l, i) => (
                <p key={i}>
                  {l.name} — {l.level}
                </p>
              ))}
            </div>
          </section>

          {/* CV */}
          <section className="space-y-3">
            <Label>Curriculum Vitae</Label>

            <label className="block cursor-pointer group">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCV}
                className="hidden"
              />

              <div className="border-2 border-dashed border-[#2b3a4d] rounded-xl p-6 text-center transition group-hover:border-blue-500 group-hover:bg-[#0f1722]">
                <p className="text-sm text-gray-400 group-hover:text-blue-400">
                  Click para subir tu CV (PDF)
                </p>
              </div>
            </label>

            {form.cvFile && (
              <p className="text-sm text-blue-400 font-medium">
                ✔ {form.cvFile}
              </p>
            )}
          </section>

          {/* BOTON FINAL */}
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg font-semibold text-lg tracking-wide shadow-lg cursor-pointer">
            Guardar Perfil
          </button>
        </form>
      </div>
    </>
  );
}

/* COMPONENTES */

function Input(props: any) {
  return (
    <input
      {...props}
      className="w-full bg-[#0f141c] border border-[#1f2a37] rounded-lg px-4 py-3
      focus:outline-none focus:border-blue-500 transition text-gray-200"
    />
  );
}

function Label({ children }: any) {
  return (
    <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}