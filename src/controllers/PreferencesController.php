<?php

declare(strict_types=1);

namespace Solspace\DarkMode\controllers;

use Craft;
use craft\web\Controller;
use Solspace\DarkMode\Plugin;
use yii\web\BadRequestHttpException;
use yii\web\Response;

final class PreferencesController extends Controller
{
    public function actionSave(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();
        $this->requireCpRequest();
        $this->requireLogin();
        $user = Craft::$app->getUser()->getIdentity();
        if (!$user->can('accessCp')) {
            throw new \yii\web\ForbiddenHttpException(Craft::t('darkmode', 'Control panel access required.'));
        }

        $mode = $this->request->getRequiredBodyParam('mode');
        if (!is_string($mode) || !in_array($mode, Plugin::MODES, true)) {
            throw new BadRequestHttpException(Craft::t('darkmode', 'Appearance must be auto, light, or dark.'));
        }

        // No user ID is accepted from the client. Craft merges unrelated preferences.
        // Craft's controller retains its normal CSRF validation.
        Craft::$app->getUsers()->saveUserPreferences($user, [Plugin::PREFERENCE => $mode]);
        return $this->asJson(['success' => true, 'mode' => $mode]);
    }
}
