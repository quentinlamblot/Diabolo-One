import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Video, Statut, Prestataire, Interviewe, ProjetVideoResponsable } from "@/types/database";
import { VideoBoard } from "./VideoBoard";
import { HabillageCard } from "./HabillageCard";
import { createVideo, updateVideo, updateVideoStatut, deleteVideo, setResponsableColonne, updateHabillage } from "./actions";

export default async function VideosPage({ params }: PageProps<"/projets/[id]/videos">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projet } = await supabase
    .from("projets")
    .select("id, nom, habillage_fait, habillage_lien, habillage_date, habillage_prestataire_id, habillage_prestataire:habillage_prestataire_id(nom)")
    .eq("id", id)
    .single();
  if (!projet) notFound();

  const [{ data: videos }, { data: statuts }, { data: prestataires }, { data: interviewes }, { data: responsables }] =
    await Promise.all([
      supabase
        .from("videos")
        .select("*, statuts(*), interviewes(*)")
        .eq("projet_id", id)
        .order("created_at"),
      supabase.from("statuts").select("*, responsable_defaut:responsable_defaut_id(*)").eq("type", "video").order("ordre"),
      supabase.from("prestataires").select("*").order("nom"),
      supabase.from("interviewes").select("id, nom, prenom").eq("projet_id", id).order("created_at"),
      supabase.from("projet_video_responsables").select("*, prestataires(*)").eq("projet_id", id),
    ]);

  const boundCreate = async (formData: FormData) => {
    "use server";
    await createVideo(id, formData);
  };
  const boundUpdate = async (videoId: string, formData: FormData) => {
    "use server";
    await updateVideo(id, videoId, formData);
  };
  const boundUpdateStatut = async (videoId: string, statutId: string) => {
    "use server";
    await updateVideoStatut(id, videoId, statutId);
  };
  const boundDelete = async (videoId: string) => {
    "use server";
    await deleteVideo(id, videoId);
  };
  const boundSetResponsable = async (statutId: string, prestataireId: string) => {
    "use server";
    await setResponsableColonne(id, statutId, prestataireId);
  };
  const boundUpdateHabillage = async (formData: FormData) => {
    "use server";
    await updateHabillage(id, formData);
  };

  const habillagePrestataire = Array.isArray(projet.habillage_prestataire) ? projet.habillage_prestataire[0] : projet.habillage_prestataire;
  const canEditHabillage = profile.role === "admin" || (profile.role === "prestataire" && profile.prestataire_id === projet.habillage_prestataire_id);
  const montrerHabillage = !!projet.habillage_prestataire_id && canEditHabillage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/projets/${id}`} className="text-sm text-zinc-500 hover:underline">
            ← {projet.nom}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Vidéos</h1>
          <p className="text-sm text-zinc-500">{(videos ?? []).length} vidéo(s) sur ce projet</p>
        </div>
        <Link href={`/projets/${id}/contacts`} className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">
          Suivi des contacts
        </Link>
      </div>

      {montrerHabillage && (
        <HabillageCard
          habillageFait={projet.habillage_fait}
          habillageLien={projet.habillage_lien}
          habillageDate={projet.habillage_date}
          prestataireNom={habillagePrestataire?.nom ?? null}
          canEdit={canEditHabillage}
          action={boundUpdateHabillage}
        />
      )}

      <VideoBoard
        statuts={(statuts ?? []) as Statut[]}
        videos={(videos ?? []) as Video[]}
        prestataires={(prestataires ?? []) as Prestataire[]}
        interviewes={(interviewes ?? []) as Interviewe[]}
        responsables={(responsables ?? []) as ProjetVideoResponsable[]}
        role={profile.role}
        currentPrestataireId={profile.prestataire_id}
        createAction={boundCreate}
        updateAction={boundUpdate}
        updateStatutAction={boundUpdateStatut}
        deleteAction={boundDelete}
        setResponsableAction={boundSetResponsable}
      />
    </div>
  );
}
