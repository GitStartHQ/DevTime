import * as React from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { SummaryPage } from './SummaryPage';
import { TimelinePage } from './TimelinePage';
import { TrayAppPage } from './TrayAppPage';

export default function MainRouterConfig({ history }: any) {
    return (
        <Router history={history}>
            <Switch>
                <Route exact path="/" component={TimelinePage} />
                <Route path="/app/timeline" component={TimelinePage} />
                <Route path="/app/settings" component={SettingsPage} />
                <Route path="/app/summary" component={SummaryPage} />
                <Route path="/app/trayApp" component={TrayAppPage} />
            </Switch>
        </Router>
    );
}
