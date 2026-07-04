export function mergeFightData(
    espnFights: any[],
    oddsFights: any[]
  ) {
    return espnFights.map((fight) => {
      const oddsMatch = oddsFights.find((oddsFight) => {
        const names = [
          oddsFight.home_team,
          oddsFight.away_team,
        ];
  
        return (
          names.includes(fight.fighterA) &&
          names.includes(fight.fighterB)
        );
      });
  
      return {
        ...fight,
        odds: oddsMatch || null,
      };
    });
  }