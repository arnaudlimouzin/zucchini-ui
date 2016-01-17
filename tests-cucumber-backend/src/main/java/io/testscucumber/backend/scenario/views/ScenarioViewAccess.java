package io.testscucumber.backend.scenario.views;

import io.testscucumber.backend.scenario.domain.Scenario;
import io.testscucumber.backend.scenario.domain.ScenarioQuery;
import io.testscucumber.backend.scenario.domain.ScenarioStatus;
import io.testscucumber.backend.scenario.domainimpl.ScenarioDAO;
import io.testscucumber.backend.support.ddd.morphia.MorphiaUtils;
import io.testscucumber.backend.testrun.domain.TestRunQuery;
import io.testscucumber.backend.testrun.domain.TestRunRepository;
import ma.glasnost.orika.BoundMapperFacade;
import org.mongodb.morphia.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Component
public class ScenarioViewAccess {

    private final ScenarioDAO scenarioDAO;

    private final TestRunRepository testRunRepository;

    private final BoundMapperFacade<Scenario, ScenarioListItemView> scenarioToListItemViewMapper;

    private final BoundMapperFacade<Scenario, ScenarioHistoryItemView> scenarioToHistoryItemViewMapper;

    @Autowired
    public ScenarioViewAccess(final ScenarioDAO scenarioDAO, final TestRunRepository testRunRepository) {
        this.scenarioDAO = scenarioDAO;
        this.testRunRepository = testRunRepository;

        final ScenarioViewMapper mapper = new ScenarioViewMapper();
        scenarioToListItemViewMapper = mapper.dedicatedMapperFor(Scenario.class, ScenarioListItemView.class, false);
        scenarioToHistoryItemViewMapper = mapper.dedicatedMapperFor(Scenario.class, ScenarioHistoryItemView.class, false);
    }

    public List<ScenarioListItemView> getScenarioListItems(final Consumer<ScenarioQuery> preparator) {
        final Query<Scenario> query = scenarioDAO.prepareTypedQuery(preparator)
            .retrievedFields(true, "id", "info", "status", "testRunId");

        return MorphiaUtils.streamQuery(query)
            .map(scenarioToListItemViewMapper::map)
            .collect(Collectors.toList());
    }

    public List<ScenarioHistoryItemView> getScenarioHistory(final String scenarioKey) {
        return testRunRepository.query(TestRunQuery::orderByLatestFirst)
            .stream()
            .map(testRun -> {
                final Scenario scenario = scenarioDAO.prepareTypedQuery(q -> q.withTestRunId(testRun.getId()).withScenarioKey(scenarioKey))
                    .retrievedFields(true, "id", "status")
                    .get();

                if (scenario == null) {
                    return null;
                }

                final ScenarioHistoryItemView item = scenarioToHistoryItemViewMapper.map(scenario);
                item.setTestRun(testRun);
                return item;
            })
            .filter(item -> item != null)
            .collect(Collectors.toList());
    }

    public List<ScenarioStatus> getScenariiStatusByFeatureId(final String featureId) {
        final Query<Scenario> query = scenarioDAO.prepareTypedQuery(q -> q.withFeatureId(featureId))
            .retrievedFields(true, "id", "status");

        return MorphiaUtils.streamQuery(query)
            .map(Scenario::getStatus)
            .collect(Collectors.toList());
    }

}