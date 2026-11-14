<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowStateResource extends JsonResource
{
    /**
     * @return array{is_following: bool, followers_count: int}
     */
    public function toArray(Request $request): array
    {
        return [
            'is_following' => (bool) $this->resource['is_following'],
            'followers_count' => (int) $this->resource['followers_count'],
        ];
    }
}