// This removes some fields:
// - defaultValues for inputs
// - deprecationReasons and isDeprecated
// - descriptions
// - directives
//
// This results in a 10-15% size decrease, this could be more
// but then buildClientSchema won't execute
// simple_schema was the test and is updated to the trimmed schema.
export default `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
            ...FullType
      }
    }
  }
  fragment FullType on __Type {
    kind
    name
    fields(includeDeprecated: true) {
      name
      args {
            ...InputValue
      }
      type {
            ...TypeRef
      }
    }
    inputFields {
          ...InputValue
    }
    interfaces {
          ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
    }
    possibleTypes {
          ...TypeRef
    }
  }
  fragment InputValue on __InputValue {
    name
    type { ...TypeRef }
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
  `;
