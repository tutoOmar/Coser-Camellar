import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

// Validador personalizado para asegurarse de que el FormArray tenga al menos un elemento
export function minLengthArray(min: number) {
  return (formArray: AbstractControl) => {
    const array = formArray as FormArray;
    return array && array.length >= min ? null : { minLengthArray: true };
  };
}
