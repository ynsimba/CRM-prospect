<?php

namespace App\Http\Controllers;

use App\Services\PrismaGateway;
use App\Services\RecordNotFoundException;
use App\Services\UniqueConstraintException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataController extends Controller
{
    public function __invoke(Request $request, PrismaGateway $gateway): JsonResponse
    {
        $model = (string) $request->input('model', '');
        $op = (string) $request->input('op', '');
        $args = $request->input('args', []);
        if (! is_array($args)) {
            $args = [];
        }

        try {
            return response()->json(['data' => $gateway->run($model, $op, $args)]);
        } catch (UniqueConstraintException $e) {
            return response()->json(['message' => $e->getMessage(), 'code' => 'P2002'], 409);
        } catch (RecordNotFoundException $e) {
            return response()->json(['message' => $e->getMessage(), 'code' => 'P2025'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            report($e);

            // Raw SQL errors stay in the Laravel log unless debugging locally.
            $message = config('app.debug') ? $e->getMessage() : 'Erreur base de données.';

            return response()->json(['message' => $message], 500);
        }
    }
}
