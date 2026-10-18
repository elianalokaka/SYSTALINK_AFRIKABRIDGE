<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;

class LireMessagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apres_id' => ['sometimes', 'integer', 'min:1'],
            'avant_id' => ['sometimes', 'integer', 'min:1'],
            'depuis' => ['sometimes', 'date'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}