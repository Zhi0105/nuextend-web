import { useContext, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { EventContext } from "@_src/contexts/EventContext";
import { Dropdown } from "primereact/dropdown";
import { useUserStore } from "@_src/store/auth";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { getModels } from "@_src/services/model";
import { getEventTypes } from "@_src/services/event";
import { getUnsdgs } from "@_src/services/unsdgs";
import { getSkills } from "@_src/services/skills";
import { getOrganizations } from "@_src/services/organization";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { InputNumber } from "primereact/inputnumber";
import { DecryptString, DecryptUser, SetTermValue } from "@_src/utils/helpers";
import { getMembers } from "@_src/services/organization";
import { Activity } from "@_src/components/Partial/Activity";
import dayjs from "dayjs";
import _ from "lodash";

export const Update = () => {
  const stepperRef = useRef(null);
  const location = useLocation();
  const event = location.state;

  const { updateEvent, updateEventLoading } = useContext(EventContext);
  const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
  const decryptedToken = token && DecryptString(token);
  const decryptedUser = token && DecryptUser(user);

  const { data: modelData, isLoading: modelLoading } = getModels();
  const { data: typeData, isLoading: typeLoading } = getEventTypes();
  const { data: unsdgData, isLoading: unsdgLoading } = getUnsdgs();
  const { data: skillData, isLoading: skillLoading } = getSkills();
  const { data: orgData, isLoading: orgLoading } = getOrganizations();

  const setFormatDate = (date) => dayjs(new Date(date)).format("MM-DD-YYYY");

  const setOrganizationList = (organizations) => _.filter(organizations, (org) => [6, 7].includes(org.pivot?.role_id));

  // Form
  const {
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      term: SetTermValue() || "",
      organization: "",
      model: "",
      event_type: null,
      unsdgs: [],
      skills: [],
      name: "",
      target_group: "",
      budget_proposal: 0,
      // Activities mirrors Create component
      activities: [],
      members: [] // <-- Add this
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "activities" });

   const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
      control,
      name: "members",
      });
      const org = watch("organization");
  
      const { data: membersData, isLoading: membersLoading } = getMembers({
          token: decryptedToken,
          organization_id: org?.id, // ✅ now safe
      });

  const modelId = watch("model.id");
  const activitiesValues = watch("activities") || [];

    const handleAddActivity = useCallback(() => {
        append({ id: null, name: "", address: "", description: "", duration: null });
    }, [append]);

  const handleRemoveActivity = useCallback(
    (index) => {
      remove(index);
    },
    [remove]
  );

  const handleActivityChange = (index, key, value) => {
    setValue(`activities.${index}.${key}`, value, { shouldDirty: true, shouldValidate: true });
  };

  // Seed form once lookups + event are ready
  useEffect(() => {
    if (!event || !modelData || !typeData || !unsdgData || !skillData || !orgData) return;

    // Resolve organization + model objects
    const organizationObj = _.find(orgData?.data, { id: event.organization_id }) || "";
    const modelObj = _.find(modelData?.data, { id: event.model_id }) || "";

    // UNSDGs/Skills from names or ids
    const filteredUNSDG = unsdgData?.data?.filter((item) =>
      (event.unsdgs || []).some((evItem) => evItem.id === item.id || evItem.name === item.name)
    );
    const filteredSkills = skillData?.data?.filter((item) =>
      (event.skills || []).some((evItem) => evItem.id === item.id || evItem.name === item.name)
    );

    // Activities: prefer event.activities; fallback to single activity fields
    let seedActivities = [];
    if (Array.isArray(event.activity) && event.activity.length > 0) {
        seedActivities = event.activity.map((a) => ({
        id: a.id || a.activity_id || null,
        name: a.name || a.activityName || "",
        address: a.address || a.activity_address || "",
        description: a.description || a.activity_description || "",
        duration: a.start_date && a.end_date ? [new Date(a.start_date), new Date(a.end_date)] : null,
      }));
    } else {
      // Flattened single-activity shape
      seedActivities = [
        {
          id: event.activity_id || null,
          name: event.activityName || event.name || "",
          address: event.activity_address || event.address || "",
          description: event.activity_description || event.description || "",
          duration:
            event.activity_start_date && event.activity_end_date
              ? [new Date(event.activity_start_date), new Date(event.activity_end_date)]
              : null,
        },
      ];
    }

    replace(seedActivities);

    reset({
      term: SetTermValue() || event.term || "",
      organization: organizationObj,
      model: modelObj,
      event_type: event.event_type_id ?? null,
      unsdgs: [...(filteredUNSDG || [])],
      skills: [...(filteredSkills || [])],
      name: event.name || event.activityName || "",
      target_group: event.target_group || "",
      budget_proposal: event.budget_proposal || 0,
      activities: seedActivities,
    });
  }, [event, modelData, typeData, unsdgData, skillData, orgData, replace, reset]);

  // Keep activities behavior aligned with Create: if model changes to non-3, ensure at least 1 row
  useEffect(() => {
    if (!modelId) return;
    if (modelId !== 3 && activitiesValues.length === 0) {
      handleAddActivity();
    }
  }, [modelId, activitiesValues.length, handleAddActivity]);

    const onSubmit = (data) => {
    const { members, organization, model, event_type, name, term, target_group, budget_proposal, skills, unsdgs, activities } = data;

    // Map to service shape: each activity has { id?, name, description, address, start_date, end_date }
    const activitiesPayload = (activities || []).map((a) => ({
        id: a.id ?? null,
        name: a.name,
        description: a.description,
        address: a.address,
        start_date: a?.duration?.[0] ? setFormatDate(a.duration[0]) : undefined,
        end_date: a?.duration?.[1] ? setFormatDate(a.duration[1]) : undefined,
    }));

    const payload = {
        token: decryptedToken,
        id: event?.id,                 // required
        user_id: decryptedUser?.id,    // optional
        organization_id: organization?.id,
        model_id: model?.id,
        event_type_id: event_type,
        // event_status_id: ... (include if you want to update it)
        name,
        target_group,
        term,
        budget_proposal,
        skills: _.map(skills, 'id'),
        unsdgs: _.map(unsdgs, 'id'),
        activities: activitiesPayload, // always send array per service contract
        members: members.map((m) => ({
          user_id: m.member.id,
          role: m.role
        }))
    };

    updateEvent(payload);
    };

  if (modelLoading || orgLoading || typeLoading || unsdgLoading || skillLoading) {
    return (
      <div className="edit-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
        Initializing form....
      </div>
    );
  }

  if (updateEventLoading) {
    return (
      <div className="edit-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
        Updating event please wait.....
      </div>
    );
  }

  return (
    <div className="edit-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-transparent flex flex-col gap-4 w-1/2 my-8">
        <label className="text-base">Update event:</label>
        <Stepper ref={stepperRef} linear>
          {/* Step 1: Model */}
          <StepperPanel>
            <div className="models">
              <Controller
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    className="w-full md:w-14rem capitalize border border-gray-400"
                    value={value}
                    onChange={onChange}
                    options={modelData?.data}
                    optionLabel="name"
                    placeholder="Select model"
                    checkmark
                    highlightOnSelect={false}
                  />
                )}
                name="model"
              />
              {errors.model && <p className="text-sm text-red-400 indent-2">Please select your model*</p>}
            </div>
            <div className="flex pt-4 justify-end px-4">
              <Button
                className="bg-[#2211cc] text-[#c7c430] px-4 py-2"
                label="Next"
                iconPos="right"
                onClick={() => {
                  trigger("model").then((valid) => {
                    if (valid) stepperRef.current.nextCallback();
                  });
                }}
              />
            </div>
          </StepperPanel>

          {/* Step 2: Event meta */}
          <StepperPanel>
            <div className="flex flex-col gap-4">
              <div className="term">
                <Controller
                  control={control}
                  render={({ field: { value } }) => (
                    <InputText
                      disabled
                      value={value}
                      name="term"
                      type="text"
                      id="term"
                      placeholder="Enter event term"
                      className={`${errors.term && "border border-red-500"} bg-blue-100 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                    />
                  )}
                  name="term"
                />
                {errors.term && <p className="text-sm italic mt-1 text-red-400 indent-2">event term is required.*</p>}
              </div>

              <div className="organization">
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      disabled={decryptedUser?.role_id === 1}
                      className={`w-full md:w-14rem capitalize ${decryptedUser?.role_id === 1 && "bg-blue-100"} border border-gray-400`}
                      value={value}
                      onChange={onChange}
                      options={setOrganizationList(decryptedUser?.organizations || orgData?.data || [])}
                      optionLabel="name"
                      placeholder="Select organization"
                      checkmark
                      highlightOnSelect={false}
                    />
                  )}
                  name="organization"
                />
                {errors.organization && <p className="text-sm text-red-400 indent-2">Please select organization*</p>}
              </div>

              <div className="eventype">
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      className="w-full md:w-14rem capitalize border border-gray-400"
                      value={value}
                      onChange={onChange}
                      options={typeData}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Type"
                      checkmark
                      highlightOnSelect={false}
                    />
                  )}
                  name="event_type"
                />
                {errors.event_type && <p className="text-sm text-red-400 indent-2">Please select your event type*</p>}
              </div>

              <div className="unsdgs">
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <MultiSelect
                      value={value}
                      onChange={onChange}
                      options={unsdgData?.data}
                      optionLabel="name"
                      display="chip"
                      placeholder="UNSDG"
                      maxSelectedLabels={3}
                      className="w-full md:w-20rem border border-gray-500"
                    />
                  )}
                  name="unsdgs"
                />
                {errors.unsdgs && <p className="text-sm text-red-400 indent-2">Please select unsdgs*</p>}
              </div>

              <div className="skills">
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <MultiSelect
                      value={value}
                      onChange={onChange}
                      options={skillData?.data}
                      optionLabel="name"
                      display="chip"
                      placeholder="Select skill needed for the event"
                      maxSelectedLabels={3}
                      className="w-full md:w-20rem border border-gray-500"
                    />
                  )}
                  name="skills"
                />
                {errors.skills && <p className="text-sm text-red-400 indent-2">Please select skills needed for your event*</p>}
              </div>

              <div className="name">
                <Controller
                  control={control}
                  rules={{ required: true, pattern: /[\S\s]+[\S]+/ }}
                  render={({ field: { onChange, value } }) => (
                    <InputText
                      value={value}
                      onChange={onChange}
                      name="name"
                      type="text"
                      id="name"
                      placeholder="Enter your event name"
                      className={`${errors.name && "border border-red-500"} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                    />
                  )}
                  name="name"
                />
                {errors.name && <p className="text-sm italic mt-1 text-red-400 indent-2">event name is required.*</p>}
              </div>

              <div className="target_group">
                <Controller
                  control={control}
                  rules={{ required: true, pattern: /[\S\s]+[\S]+/ }}
                  render={({ field: { onChange, value } }) => (
                    <InputText
                      value={value}
                      onChange={onChange}
                      name="target_group"
                      type="text"
                      id="target_group"
                      placeholder="Enter your target group name"
                      className={`${errors.target_group && "border border-red-500"} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                    />
                  )}
                  name="target_group"
                />
                {errors.target_group && <p className="text-sm italic mt-1 text-red-400 indent-2">event target group name is required.*</p>}
              </div>

              <div className="budget">
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <InputNumber
                      inputClassName={`${errors.budget_proposal && "border border-red-500"} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                      name="budget_proposal"
                      value={value}
                      onValueChange={onChange}
                      rows={4}
                      placeholder="Enter your budget proposal"
                    />
                  )}
                  name="budget_proposal"
                />
                {errors.budget_proposal && <p className="text-sm italic mt-1 text-red-400 indent-2">budget is required.*</p>}
              </div>

              <div className="flex pt-4 justify-between px-4">
                <Button className="bg-[#2211cc] text-[#c7c430] px-4 py-2" label="Back" severity="secondary" onClick={() => stepperRef.current.prevCallback()} />
                <Button
                  className="bg-[#2211cc] text-[#c7c430] px-4 py-2"
                  label="Next"
                  iconPos="right"
                  onClick={() => {
                    trigger().then((valid) => {
                      if (valid) stepperRef.current.nextCallback();
                    });
                  }}
                />
              </div>
            </div>
          </StepperPanel>

          <StepperPanel>
              <div>
                  <div className="w-full capitalize flex flex-col gap-2">
                  {membersLoading ? (
                      <div className="text-center py-6">Loading members...</div>
                  ) : (
                      <>
                      <label className="font-semibold text-lg mb-2">
                          Organization Members
                      </label>

                      {!watch("organization") ? (
                          <p className="italic text-gray-500">
                          Please select an organization first.
                          </p>
                      ) : (
                          <>
                          {(() => {
                              const filteredMembers =
                              membersData?.data?.filter((m) => m?.pivot?.role_id === 8) || [];

                              // All currently selected member IDs
                              const selectedMemberIds =
                              watch("members")?.map((m) => m?.member?.id) || [];

                              return (
                              <>
                                  {memberFields.map((field, index) => (
                                  <div
                                      key={field.id}
                                      className="border border-gray-300 rounded-lg p-4 flex flex-col gap-2 bg-gray-50 relative"
                                  >
                                      {/* Member Dropdown */}
                                      <Controller
                                      control={control}
                                      name={`members.${index}.member`}
                                      defaultValue={null}
                                      render={({ field: { onChange, value } }) => {
                                          // ✅ Use current field value here, not watch()
                                          const availableMembers = filteredMembers.filter(
                                          (m) =>
                                              !selectedMemberIds.includes(m.id) ||
                                              m.id === value?.id
                                          );

                                          return (
                                          <Dropdown
                                              value={value}
                                              onChange={(e) => onChange(e.value)}
                                              options={availableMembers}
                                              optionLabel="firstname"
                                              placeholder="Select member"
                                              className="w-full border border-gray-400 rounded-md"
                                              itemTemplate={(option) => (
                                              <div>
                                                  {option.firstname} {option.lastname}
                                              </div>
                                              )}
                                              valueTemplate={(option) =>
                                              option ? (
                                                  <div>
                                                  {option.firstname} {option.lastname}
                                                  </div>
                                              ) : (
                                                  <span className="text-gray-400">
                                                  Select member
                                                  </span>
                                              )
                                              }
                                          />
                                          );
                                      }}
                                      />

                                      {/* Role input */}
                                      <Controller
                                      control={control}
                                      name={`members.${index}.role`}
                                      defaultValue=""
                                      render={({ field: { onChange, value } }) => (
                                          <InputText
                                          value={value}
                                          onChange={onChange}
                                          placeholder="Enter role"
                                          className="border border-gray-400 rounded-md p-2 w-full"
                                          />
                                      )}
                                      />

                                      {/* Remove Button */}
                                      <span
                                      className="absolute top-2 right-3 text-[22px] text-red-500 cursor-pointer"
                                      onClick={() => removeMember(index)}
                                      >
                                      ×
                                      </span>
                                  </div>
                                  ))}

                                  {/* Add New Member Button */}
                                  {filteredMembers.length > 0 &&
                                  memberFields.length < filteredMembers.length && (
                                      <span
                                      className="text-[25px] text-[#5b9bd1] cursor-pointer mt-2 self-start"
                                      onClick={() =>
                                          appendMember({ member: null, role: "" })
                                      }
                                      >
                                      +
                                      </span>
                                  )}
                              </>
                              );
                          })()}
                          </>
                      )}
                      </>
                  )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex pt-4 justify-between">
                  <Button
                      className="bg-[#2211cc] text-[#c7c430] px-4 py-2"
                      label="Back"
                      severity="secondary"
                      onClick={() => stepperRef.current.prevCallback()}
                  />
                  <Button
                      className="bg-[#2211cc] text-[#c7c430] px-4 py-2"
                      label="Next"
                      iconPos="right"
                      onClick={() => {
                      trigger().then((valid) => {
                          if (valid) stepperRef.current.nextCallback();
                      });
                      }}
                  />
                  </div>
              </div>
          </StepperPanel>
          
          {/* Step 3: Activities */}
          <StepperPanel>
            <div>
              <div className="w-full capitalize flex flex-col gap-2">
                <Activity
                  modelId={modelId}
                  activities={activitiesValues}
                  activityKeys={fields.map((f) => f.id)}
                  onRemove={handleRemoveActivity}
                  onChange={handleActivityChange}
                />
                {modelId === 3 && (
                  <span className="text-[25px] text-[#5b9bd1] cursor-pointer" onClick={handleAddActivity}>
                    +
                  </span>
                )}
              </div>
              <div className="flex pt-4 justify-between">
                <Button className="bg-[#2211cc] text-[#c7c430] px-4 py-2" label="Back" severity="secondary" onClick={() => stepperRef.current.prevCallback()} />
                <Button disabled={updateEventLoading} type="submit" className="bg-[#2211cc] text-[#c7c430] px-4 py-2" label="Update" iconPos="right" />
              </div>
            </div>
          </StepperPanel>
        </Stepper>
      </form>
    </div>
  );
};
