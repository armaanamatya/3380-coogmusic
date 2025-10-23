import express from "express";
import cors from "cors";
import { z } from "zod";
import { getDb } from "./db";

const app = express();
app.use(cors());
app.use(express.json());

// GET user by ID
app.get("/api/users/:id", async (req, res) => {
  const db = await getDb();
  const user = await db.get(
    "SELECT id, username, display_name, email, role, bio FROM users WHERE id = ?",
    req.params.id
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// PATCH user info
const UpdateUser = z.object({
  display_name: z.string().max(60).optional(),
  email: z.string().email().optional(),
  role: z.enum(["Listener", "Artist", "Administrator"]).optional(),
  bio: z.string().max(300).optional(),
});

app.patch("/api/users/:id", async (req, res) => {
  const parse = UpdateUser.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });

  const { display_name, email, role, bio } = parse.data;
  const db = await getDb();

  const fields: string[] = [];
  const values: any[] = [];

  if (display_name !== undefined) { fields.push("display_name = ?"); values.push(display_name); }
  if (email !== undefined) { fields.push("email = ?"); values.push(email); }
  if (role !== undefined) { fields.push("role = ?"); values.push(role); }
  if (bio !== undefined) { fields.push("bio = ?"); values.push(bio); }

  if (!fields.length) return res.status(400).json({ error: "No fields to update" });

  values.push(req.params.id);
  await db.run(
    `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  const updated = await db.get(
    "SELECT id, username, display_name, email, role, bio FROM users WHERE id = ?",
    req.params.id
  );

  res.json(updated);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));
