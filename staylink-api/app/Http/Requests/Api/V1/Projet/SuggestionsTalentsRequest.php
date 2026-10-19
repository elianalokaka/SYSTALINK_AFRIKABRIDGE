<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;

class SuggestionsTalentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'limit' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ];
    }
}
