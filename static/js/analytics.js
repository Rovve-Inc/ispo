// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', function() {
    fetchValidatorAnalytics();
    initializeCharts();
});

async function fetchValidatorAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        
        // Update dashboard metrics
        document.getElementById('validatorRank').textContent = data.rank || '-';
        document.getElementById('activeDelegators').textContent = data.active_delegators || '-';
        document.getElementById('uptime').textContent = (data.uptime || 0).toFixed(2);
        document.getElementById('commission').textContent = (data.commission_rate || 0).toFixed(1);
        document.getElementById('blocksSigned').textContent = data.blocks_signed?.toLocaleString() || '-';
        document.getElementById('totalStake').textContent = `${Number(data.total_delegated || 0).toLocaleString()} HASH`;
        document.getElementById('validatorStatus').textContent = data.status || '-';
        
        // Update charts
        updateDelegationChart(data.delegation_history);
        updateDistributionChart(data.distribution_data);
    } catch (error) {
        console.error('Error fetching analytics:', error);
    }
}

function initializeCharts() {
    // Delegation history chart
    new Chart(document.getElementById('delegationChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total HASH Delegated',
                data: [],
                borderColor: '#0dcaf0',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' HASH';
                        }
                    }
                }
            }
        }
    });

    // Distribution chart
    new Chart(document.getElementById('distributionChart'), {
        type: 'pie',
        data: {
            labels: ['< 1K HASH', '1K-10K HASH', '10K-100K HASH', '> 100K HASH'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#0dcaf0', '#20c997', '#0d6efd', '#6610f2']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateDelegationChart(history) {
    const chart = Chart.getChart('delegationChart');
    if (chart && history) {
        chart.data.labels = history.map(h => new Date(h.date).toLocaleDateString());
        chart.data.datasets[0].data = history.map(h => h.total_delegated);
        chart.update();
    }
}

function updateDistributionChart(distribution) {
    const chart = Chart.getChart('distributionChart');
    if (chart && distribution) {
        chart.data.datasets[0].data = [
            distribution.small,
            distribution.medium,
            distribution.large,
            distribution.xlarge
        ];
        chart.update();
    }
}

// Refresh data every 5 minutes
setInterval(fetchValidatorAnalytics, 5 * 60 * 1000);
