import { dateRegex, dateTimeRegex, timeRegex } from '../../utils/helpers';
import { query, body } from "express-validator";

export function query_positive_integer(param: string) {
  return query(param)
    .isInt({min: 1})
    .withMessage(`'${param}' must be a positive integer`);
}

export function query_positive_integer_array(param: string) {
  return query(param)
    .customSanitizer((id: string|string[]) => {
      if (Array.isArray(id)) {
        return id.map(i => Number(i));
      } else {
        return [Number(id)];
      }
    })
    .custom((type: number[]) => {
      return type.filter(t => isNaN(t) || t <= 0).length === 0;
    })
    .withMessage(`'${param}' must be a positive integer or integer array`);
}

export function query_enum_array(param: string, Enum: any) {
  return query(param)
    .customSanitizer((type: string|string[]) => {
      if (Array.isArray(type)) {
        return type.map(t => t.toUpperCase());
      } else {
        return [type.toUpperCase()];
      }
    })
    .custom((type: string[]) => {
      return type.filter(t => !(t in Enum)).length === 0;
    })
    .withMessage(`'${param}' must be any of []`);
}

export function query_date_time(param: string) {
  return query(param)
    .matches(dateTimeRegex)
    .withMessage(`'${param}' must be of the format 20YY-MM-DDTHH:MM`);
}

export function body_positive_integer(param: string) {
  return body(param)
    .isInt({min: 1})
    .withMessage(`'${param}' must be a positive integer`);
}

export function body_enum(param: string, Enum: any) {
  return body(param)
    .isString()
    .toUpperCase()
    .custom(type => [type].filter(t => !(t in Enum)).length === 0)
    .withMessage(`'${param}' must be any of []`);
}

export function body_enum_array(param: string, Enum: any) {
  return body(param)
    .customSanitizer((type: any|any[]) => {
      if (Array.isArray(type)) {
        return type.map(t => t.toString().toUpperCase());
      } else {
        return [type.toString().toUpperCase()];
      }
    })
    .custom((type: string[]) => {
      return type.filter(t => !(t in Enum)).length === 0;
    })
    .withMessage(`'${param}' must be any of []`);
}

export function body_non_empty_string(param: string) {
  return body(param)
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`'${param}' must be a valid string`);
}

export function body_amount(param: string) {
  return body(param)
    .isFloat({min: 0})
    .withMessage(`'${param}' must be a vaild amount`);
}

export function body_date(param: string) {
  return body(param)
    .matches(dateRegex)
    .withMessage(`'${param}' must be of the format 20YY-MM-DD`);
}

export function body_time(param: string) {
  return body(param)
    .matches(timeRegex)
    .withMessage(`'${param}' must be of the format HH:MM`);
}

export function body_date_time(param: string) {
  return body(param)
    .matches(dateTimeRegex)
    .withMessage(`'${param}' must be of the format 20YY-MM-DDTHH:MM`);
}

export function body_mobile_number(param: string) {
  return body(param)
    .isString()
    .isMobilePhone('en-IN')
    .withMessage(`'${param}' must be a valid IN phone number`);
}

export function body_email(param: string) {
  return body(param)
    .isString()
    .isEmail()
    .withMessage(`'${param}' must be a valid email id`);
}
