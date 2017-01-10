
(() => {
  window.app._debug = {
    simulateRatioLimitError: (resetIn) => {
      let simResetDate = new Date(Date.now() + (resetIn || 3600) * 1000);
      window.app.GitHubElement.renderRateLimitError(simResetDate.getTime() / 1000);
    },
    exceedUnauthedRatioLimit: () => {
      console.debug('Exceeding ratio limit for unauthorized user: ');

      let requests = {
        sent: 0,
        finished: 0,
        withError: []
      };

      let reportWhenFinished = () => {
        let errs = requests.withError;
        let sent = requests.sent;
        let finished = requests.finished;
        let failed = errs.length;

        if (finished + failed === sent) {
          let errsWithRateLimit = errs.filter((err) => err.statusCode === 403);
          let failedWithRateLimit = errsWithRateLimit.length;

          console.debug(`${sent} requests sent and answers received. %c✓`, 'color: green');

          console.debug(`${finished} requests finished without errors.`);
          console.debug(`${failed} requests failed with error. %c${failed > 0 ? '✓' : 'x'}`, `color: ${failed > 0 ? 'green' : 'red'}`);
          if (failedWithRateLimit > 0) {
            let resetHeader = parseInt(errsWithRateLimit[0].response.headers['x-ratelimit-reset'], 10) * 1000;
            console.debug(`%c${failedWithRateLimit} requests failed with statusCode 403`, 'color: white; background: green');
            let reset = new Date(resetHeader).toLocaleString();
            console.debug('Congratulations! You are now officially blocked from the GitHub API, until ' + reset);
          }
        }
      };

      for (let i = 1; i <= 65; i++) {
        let requestId = i;
        requests.sent++;
        window.app.request.send().then(() => {
          requests.finished++;
          console.debug(`Request #${requestId} finished. %c✓`, 'color: green');
          reportWhenFinished();
        })
        .catch((err) => {
          requests.withError.push(err);
          console.debug(`Request #${requestId} failed. %cx`, 'color: red');
          reportWhenFinished();
        });
        console.debug(`Request #${requestId} sent. ~`);
      }
    }
  };
})();
