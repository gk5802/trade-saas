import { EmailField, UsernameField } from "@/lib/sanitizer/strongSanitizer"
import { validateSchema, SchemaField } from "@/lib/validator/schema"

const schema: Record<string, SchemaField> = {
  email: EmailField,
  username: UsernameField,
}

const res = validateSchema(schema, {
  email: "USER@X.COM",
  username: "User",
})

console.log(res)
