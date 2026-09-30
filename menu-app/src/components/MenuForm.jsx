import { useState } from 'react';
import { Link } from 'react-router';

import { AlertIcon } from './Icons.jsx';
import { NAME_MAX, toMenu, validateForm } from './menuForm.js';
import { ErrorRecord } from './StateCard.jsx';
import { formatGold, getRarity } from './rarity.js';

// 등록·수정 공용 장부. 값과 검증 결과는 이 화면에서만 쓰므로 useState 에 둔다.
const MenuForm = ({ initialForm, categoryGroups, currentCategory, submitLabel, busyLabel, cancelTo, onSubmit }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const change = (name) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setServerError(null);

    const firstInvalid = ['menuName', 'menuPrice', 'categoryCode'].find((name) => nextErrors[name]);
    if (firstInvalid) {
      event.currentTarget.elements.namedItem(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toMenu(form));
    } catch (error) {
      setServerError(error);
      setSubmitting(false);
    }
  };

  const price = Number(form.menuPrice);
  const priceHint =
    Number.isInteger(price) && price > 0
      ? `${formatGold(price)} G · ${getRarity(price).name} 등급으로 진열된다네.`
      : '1 G 이상의 정수로 적는다.';

  // 최상위 카테고리에 속한 기존 메뉴(시드 데이터 4건)는 선택지에 없으므로 현재 값을 따로 보여 준다.
  const isCurrentTopLevel =
    currentCategory && !categoryGroups.some((group) => group.children.some((c) => c.categoryCode === currentCategory.categoryCode));

  return (
    <form className="menu-form panel panel-gold" onSubmit={handleSubmit} noValidate>
      {serverError && <SubmitError error={serverError} />}

      <div className="field">
        <label className="field-label label1 bold" htmlFor="menuName">
          카드 이름 <span className="req">*</span>
        </label>
        <div className={`control${errors.menuName ? ' is-error' : ''}`}>
          <input
            id="menuName"
            name="menuName"
            className="body1 regular"
            type="text"
            maxLength={NAME_MAX + 10}
            placeholder="예: 드래곤 숨결 핫소스"
            value={form.menuName}
            onChange={change('menuName')}
            aria-invalid={Boolean(errors.menuName)}
            aria-describedby={errors.menuName ? 'menuName-error' : undefined}
          />
          <span className="control-count caption1 medium">
            {form.menuName.trim().length}/{NAME_MAX}
          </span>
        </div>
        {errors.menuName && (
          <p id="menuName-error" className="field-error caption1 medium">
            {errors.menuName}
          </p>
        )}
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label label1 bold" htmlFor="menuPrice">
            몸값 <span className="req">*</span>
          </label>
          <div className={`control${errors.menuPrice ? ' is-error' : ''}`}>
            <input
              id="menuPrice"
              name="menuPrice"
              className="body1 regular"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="예: 4500"
              value={form.menuPrice}
              onChange={change('menuPrice')}
              aria-invalid={Boolean(errors.menuPrice)}
              aria-describedby={errors.menuPrice ? 'menuPrice-error' : 'menuPrice-hint'}
            />
            <span className="control-suffix label1 bold">G</span>
          </div>
          {errors.menuPrice ? (
            <p id="menuPrice-error" className="field-error caption1 medium">
              {errors.menuPrice}
            </p>
          ) : (
            <p id="menuPrice-hint" className="field-hint caption1 regular">
              {priceHint}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field-label label1 bold" htmlFor="categoryCode">
            요리 계통 <span className="req">*</span>
          </label>
          <div className={`control${errors.categoryCode ? ' is-error' : ''}`}>
            <select
              id="categoryCode"
              name="categoryCode"
              className="body1 regular"
              value={form.categoryCode}
              onChange={change('categoryCode')}
              aria-invalid={Boolean(errors.categoryCode)}
              aria-describedby={errors.categoryCode ? 'categoryCode-error' : undefined}
            >
              <option value="">계통 선택</option>
              {isCurrentTopLevel && (
                <option value={currentCategory.categoryCode}>{currentCategory.categoryName} (현재 계통)</option>
              )}
              {categoryGroups.map((group) => (
                <optgroup key={group.categoryCode} label={group.categoryName}>
                  {group.children.map((category) => (
                    <option key={category.categoryCode} value={category.categoryCode}>
                      {category.categoryName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {errors.categoryCode && (
            <p id="categoryCode-error" className="field-error caption1 medium">
              {errors.categoryCode}
            </p>
          )}
        </div>
      </div>

      <fieldset className="field form-fieldset">
        <legend className="field-label label1 bold">판매 여부</legend>
        <div className="segmented">
          {[
            ['Y', '판매 중'],
            ['N', '품절'],
          ].map(([value, label]) => (
            <label key={value} className={`segment label1 ${form.orderableStatus === value ? 'bold is-selected' : 'medium'}`}>
              <input
                type="radio"
                name="orderableStatus"
                value={value}
                checked={form.orderableStatus === value}
                onChange={change('orderableStatus')}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <Link to={cancelTo} className="btn btn-outlined label1 medium" aria-disabled={submitting}>
          그만두기
        </Link>
        <button type="submit" className="btn btn-primary label1 bold" disabled={submitting}>
          {submitting ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

// 서버 오류: 상인의 대사 + 장부 기록(서버 description·detail·code 그대로)
const SubmitError = ({ error }) => (
  <div className="message message-negative" role="alert">
    <span className="message-icon">
      <AlertIcon size={20} />
    </span>
    <div className="message-body">
      <p className="npc-name caption1 bold">{error.type === 'network' ? '상인의 쪽지' : '상인'}</p>
      <p className="message-title label1 bold">
        {error.type === 'network' ? '“가게 문이 닫혀 있어 장부에 적지 못했다네.”' : '“장부에 적지 못했다네.”'}
      </p>
      {error.type === 'network' ? (
        <p className="state-fact label2 regular">서버 응답 없음 · localhost:8080</p>
      ) : (
        <ErrorRecord error={error} />
      )}
    </div>
  </div>
);

export default MenuForm;
