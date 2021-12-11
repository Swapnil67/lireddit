// import schema from "../validations/password";

import { Field, ObjectType } from "type-graphql";
import { OptionalObjectSchema } from "yup/lib/object";
import { AnyObject } from "yup/lib/types";
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class validateResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

const validateField = async (field: any, inputValue: string, schema: OptionalObjectSchema<AnyObject>, inputField: string): Promise<validateResponse> => {
	let err = {errors: undefined};
  try {
		await schema.validate(field);
	} catch (error) {
		// console.log(error);
		return {
				errors: [
					{
						field: inputField,
						message: error.errors[0],
					},
				],
			}
	}
	return err;
}

export default validateField;