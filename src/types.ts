/** A scalar is any fieldValue without a type. It can also include lists of scalars and embedded objects, which are simply represented as empty object type. */
export type Scalar = {} | string | number | null;

export type NullPrototype = { [K in keyof ObjectConstructor]: never };

export interface SystemFields {
  __typename?: string;
  _id?: string | number | null;
  id?: string | number | null;
}

export interface EntityFields {
  [fieldName: string]: Scalar;
}

/** Every Entity must have a typeName. It might have some ID fields of which `id` and `_id` are recognised by default. Every other fieldValue is a scalar. */
export type Entity = NullPrototype & SystemFields & EntityFields;

/** A link is a key or array of keys referencing other entities in the Records Map. It may be or contain `null`. */
export type Link = null | string | Array<string | null>;

/** A link can be resolved into the entities it points to. The resulting structure is a ResolvedLink */
export type ResolvedLink = null | Entity | Array<Entity | null>;

export type Records = Map<string, Entity>;
export type Links = Map<string, Link>;
export type Embedded = Map<string, Scalar>;
