<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInternalToken
{
    public function handle(Request $request, Closure $next): Response
    {
        // Read through config so the token survives `php artisan config:cache`.
        $expected = (string) config('services.internal.token', '');
        $given = (string) $request->header('X-Internal-Token', '');
        if ($expected === '' || ! hash_equals($expected, $given)) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        return $next($request);
    }
}
