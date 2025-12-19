import { fail, redirect } from "@sveltejs/kit";
import { isNotEmpty, validateEmailField } from "$lib/utils/validation";
import { validatePassword } from "$lib/utils/passwordValidation";
import { COUNTRIES } from "$lib/utils/countries";
import {
  createUserSession,
  hashPassword,
} from "$lib/server/services/authService";
import { createUser, userExists } from "$lib/server/services/userService";
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

    // Validation de l'email
    const emailValidation = validateEmailField(email);
    if (!emailValidation.isValid) {
      return fail(400, {
        message: emailValidation.error!,
        email: email?.toString() || "",
      });
    }

    // Validation du mot de passe
    if (!password || typeof password !== "string") {
      return fail(400, {
        message: "Le mot de passe est requis",
        email: email!.toString(),
      });
    }

    // Validation des règles de mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail(400, {
        message: passwordValidation.errors[0],
        email: email!.toString(),
      });
    }

    // Vérification de la correspondance des mots de passe
    if (password !== confirmPassword) {
      return fail(400, {
        message: "Les mots de passe ne correspondent pas",
        email: email!.toString(),
      });
    }

    // Validation des autres champs
    if (!firstName || typeof firstName !== "string" || !isNotEmpty(firstName)) {
      return fail(400, {
        message: "Le prénom est requis",
        email: email!.toString(),
      });
    }

    if (!lastName || typeof lastName !== "string" || !isNotEmpty(lastName)) {
      return fail(400, {
        message: "Le nom est requis",
        email: email!.toString(),
      });
    }

    if (
      !nationality ||
      typeof nationality !== "string" ||
      !isNotEmpty(nationality)
    ) {
      return fail(400, {
        message: "La nationalité est requise",
        email: email!.toString(),
      });
    }

    // Validation que la nationalité fait partie de la liste des pays
    if (!COUNTRIES.includes(nationality as any)) {
      return fail(400, {
        message: "La nationalité sélectionnée n'est pas valide",
        email: email!.toString(),
      });
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      if (await userExists(email as string)) {
        return fail(400, {
          message: "Un compte existe déjà avec cette adresse email",
          email: email!.toString(),
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password);

      // Créer l'utilisateur
      const user = await createUser({
        email: email as string,
        password: hashedPassword,
        firstName: firstName as string,
        lastName: lastName as string,
        nationality: nationality as string,
      });

      // Créer une session pour l'utilisateur
      await createUserSession(user.id, cookies);
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);
      return fail(500, {
        message: "Une erreur est survenue lors de la création du compte",
        email: email!.toString(),
      });
    }

    // Rediriger vers la page d'accueil après inscription réussie
    throw redirect(302, "/");
  },
};
