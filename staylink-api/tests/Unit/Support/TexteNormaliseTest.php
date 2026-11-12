<?php

namespace Tests\Unit\Support;

use App\Support\TexteNormalise;
use PHPUnit\Framework\TestCase;

class TexteNormaliseTest extends TestCase
{
    public function test_javascript_et_java_script_partagent_la_meme_clef(): void
    {
        $this->assertSame(
            TexteNormalise::clef('JavaScript'),
            TexteNormalise::clef('javascript')
        );
    }

    public function test_les_accents_sont_ignores(): void
    {
        $this->assertSame(
            TexteNormalise::clef('Éducation'),
            TexteNormalise::clef('education')
        );
    }
}
