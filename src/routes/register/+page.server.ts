import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";
import { Argon2id } from "oslo/password";
import { prisma } from "$lib/server/db";
import { generateIdFromEntropySize } from "lucia";
import { validatePassword } from "$lib/utils/passwordValidation";
import { COUNTRIES } from "$lib/utils/countries";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const nationality = formData.get("nationality");

    // Validation des champs requis
    if (!email || typeof email !== "string" || email.length === 0) {
      return fail(400, {
        message: "L'adresse email est requise",
        email: email?.toString() || "",
      });
    }

    if (!password || typeof password !== "string") {
      return fail(400, {
        message: "Le mot de passe est requis",
        email: email.toString(),
      });
    }

    // Validation des règles de mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail(400, {
        message: passwordValidation.errors[0], // Premier message d'erreur
        email: email.toString(),
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        message: "Les mots de passe ne correspondent pas",
        email: email.toString(),
      });
    }

    if (!firstName || typeof firstName !== "string" || firstName.length === 0) {
      return fail(400, {
        message: "Le prénom est requis",
        email: email.toString(),
      });
    }

    if (!lastName || typeof lastName !== "string" || lastName.length === 0) {
      return fail(400, {
        message: "Le nom est requis",
        email: email.toString(),
      });
    }

    if (
      !nationality ||
      typeof nationality !== "string" ||
      nationality.length === 0
    ) {
      return fail(400, {
        message: "La nationalité est requise",
        email: email.toString(),
      });
    }

    // Validation que la nationalité fait partie de la liste des pays
    if (!COUNTRIES.includes(nationality as any)) {
      return fail(400, {
        message: "La nationalité sélectionnée n'est pas valide",
        email: email.toString(),
      });
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        message: "L'adresse email n'est pas valide",
        email: email.toString(),
      });
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return fail(400, {
          message: "Un compte existe déjà avec cette adresse email",
          email: email.toString(),
        });
      }

      // Hasher le mot de passe
      const argon2id = new Argon2id();
      const hashedPassword = await argon2id.hash(password);

      // Générer un ID unique pour l'utilisateur
      const userId = generateIdFromEntropySize(10);

      // Créer l'utilisateur
      await prisma.user.create({
        data: {
          id: userId,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          nationality,
        },
      });

      // Créer une session pour l'utilisateur
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: ".",
        ...sessionCookie.attributes,
      });
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);
      return fail(500, {
        message: "Une erreur est survenue lors de la création du compte",
        email: email.toString(),
      });
    }

    // Rediriger vers la page d'accueil après inscription réussie
    throw redirect(302, "/");
  },
};
